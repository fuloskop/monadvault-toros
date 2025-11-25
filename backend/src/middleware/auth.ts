import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { prisma } from '../config/database.js';
import { AppError } from './errorHandler.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export interface AuthUser {
  id: string;
  walletAddress: string;
  username: string | null;
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

export async function generateToken(user: AuthUser): Promise<string> {
  const token = await new jose.SignJWT({
    sub: user.id,
    wallet: user.walletAddress,
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

  return {
    id: payload.sub as string,
    walletAddress: payload.wallet as string,
    username: payload.username as string | null,
    level: payload.level as number,
    isVip: payload.isVip as boolean,
    vipTier: payload.vipTier as number,
  };
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyToken(token);

    // Check if user still exists and is not banned
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, isBanned: true, banReason: true },
    });

    if (!dbUser) {
      throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
    }

    if (dbUser.isBanned) {
      throw new AppError(403, 'Account banned', 'ACCOUNT_BANNED');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, 'Invalid token', 'TOKEN_INVALID');
  }
}

// Optional auth - sets user if token present, but doesn't require it
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyToken(token);
    req.user = user;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

// Admin middleware - requires admin role
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { walletAddress: true },
  });

  // Check if user is admin (you'd have an admin list or role field)
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.toLowerCase());
  
  if (!user || !adminWallets.includes(user.walletAddress.toLowerCase())) {
    throw new AppError(403, 'Admin access required', 'ADMIN_REQUIRED');
  }

  next();
}

