import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { prisma } from '../config/database.js';
import { AppError } from './errorHandler.js';
import { readSession, type SessionData } from '../lib/session.js';

// TOROS fork: orijinal MonadVault auth wallet-sign + JWT'di. Bu fork
// torosclan.com/games altında çalışıyor; auth toroscs iron-session cookie'si
// ile akıyor. Eski JWT mekanizması fallback olarak yerinde duruyor (upstream
// merge'lerde silinmesin diye) ama default yol cookie reader.

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export interface AuthUser {
  id: string;
  steamId: string;
  // Legacy alan — eski kod walletAddress okuyor, kırmamak için steamId'yi
  // burada da expose ediyoruz. Schema migrasyonu Task 32'de.
  walletAddress: string;
  username: string | null;
  avatar: string | null;
  level: number;
  isVip: boolean;
  vipTier: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Legacy JWT util'leri — wallet auth artık yok ama signature'lar başka
// yerlerden import ediliyor olabilir, stub tut.
export async function generateToken(user: AuthUser): Promise<string> {
  const token = await new jose.SignJWT({
    sub: user.id,
    steam: user.steamId,
    username: user.username,
    level: user.level,
    isVip: user.isVip,
    vipTier: user.vipTier,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRY || '7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jose.jwtVerify(token, JWT_SECRET);
  const steamId = (payload.steam as string) ?? (payload.wallet as string); // bw-compat
  return {
    id: payload.sub as string,
    steamId,
    walletAddress: steamId,
    username: (payload.username as string) ?? null,
    avatar: null,
    level: (payload.level as number) ?? 1,
    isVip: (payload.isVip as boolean) ?? false,
    vipTier: (payload.vipTier as number) ?? 0,
  };
}

// SessionData'yı (toroscs cookie shape) AuthUser'a dönüştürür. DB find-or-create
// yapar (steamId unique key). Cookie modunda her request'te bir prisma upsert
// — hot path, ama steam_id index'le ucuz. Sonra Redis cache eklenebilir.
async function sessionToAuthUser(session: SessionData): Promise<AuthUser> {
  if (!session.isLoggedIn || !session.steamId) {
    throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const steamId = session.steamId;

  // Task 32 sonrası: User.steamId proper unique field. find-or-create
  // pattern'i Steam OpenID üzerinden gelen kullanıcılar için.
  let user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        steamId,
        username: session.username ?? null,
        avatar: session.avatar ?? null,
        clientSeed: Math.random().toString(36).substring(2, 18),
      },
    });
    // İlk login'de balance kaydı oluşturmuyoruz; case-open / game-play
    // ilk işlemde BalanceService idempotent ensure ediyor.
  } else if (
    (session.username && user.username !== session.username) ||
    (session.avatar && user.avatar !== session.avatar)
  ) {
    // Steam profil güncellemelerini sessizce sync et
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: session.username ?? user.username,
        avatar: session.avatar ?? user.avatar,
      },
    });
  }

  if (user.isBanned) {
    throw new AppError(403, 'Account banned', 'ACCOUNT_BANNED');
  }

  return {
    id: user.id,
    steamId,
    // Legacy alan — eski kod walletAddress okuyor. Steam ID'yi göstererek
    // çağıranları kırmıyoruz; gerçek wallet field'ı null kaldı.
    walletAddress: user.walletAddress ?? steamId,
    username: user.username,
    avatar: user.avatar,
    level: user.level,
    isVip: user.isVip,
    vipTier: user.vipTier,
  };
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Öncelik 1: iron-session cookie (TOROS varsayılan)
    const session = await readSession(req, res);
    if (session.isLoggedIn && session.steamId) {
      req.user = await sessionToAuthUser(session);
      return next();
    }

    // Öncelik 2: Authorization Bearer JWT (legacy, web3 enabled durum)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        req.user = await verifyToken(token);
        return next();
      } catch {
        throw new AppError(401, 'Invalid token', 'TOKEN_INVALID');
      }
    }

    throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
  } catch (error) {
    next(error);
  }
}

// Optional auth - sets user if session/token present, but doesn't require it
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await readSession(req, res);
    if (session.isLoggedIn && session.steamId) {
      req.user = await sessionToAuthUser(session);
      return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        req.user = await verifyToken(authHeader.substring(7));
      } catch {
        // optional: invalid token sessizce atla
      }
    }
  } catch {
    // optional: hata varsa anonim devam
  }
  next();
}

// Admin middleware — req.user mevcut olmalı (authMiddleware'den sonra mount)
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'));
  }

  // Session-based admin flag (toroscs cookie'sinde isAdmin var)
  // veya env'deki ADMIN_STEAM_IDS listesinde olabilir.
  const adminIds = (process.env.ADMIN_STEAM_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminIds.includes(req.user.steamId)) {
    return next();
  }

  // Cookie session'da işaretliyse de OK
  try {
    const session = await readSession(req, res);
    if (session.isAdmin || session.isSystemAdmin) {
      return next();
    }
  } catch {
    // ignore
  }

  return next(new AppError(403, 'Admin access required', 'ADMIN_REQUIRED'));
}
