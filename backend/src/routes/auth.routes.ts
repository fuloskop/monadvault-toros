import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { readSession } from '../lib/session.js';

// TOROS fork: Wallet sign-in (nonce/verify) endpoint'leri 410 GONE döner.
// Steam OpenID login akışı toroscs'ta. Nginx /games/api/auth/login →
// toroscs handler'a proxy'lenir; games backend bu yola hiç düşmez. Geri
// kalan auth endpoint'leri (logout, session readback) cookie üzerinden çalışır.

export const authRoutes = Router();

const GONE_MESSAGE =
  'Wallet sign-in is disabled on TOROS Games. Use Steam login at /api/auth/login.';

authRoutes.post('/nonce', (_req, _res, next) => {
  next(new AppError(410, GONE_MESSAGE, 'AUTH_METHOD_REMOVED'));
});

authRoutes.post('/verify', (_req, _res, next) => {
  next(new AppError(410, GONE_MESSAGE, 'AUTH_METHOD_REMOVED'));
});

authRoutes.post('/refresh', (_req, _res, next) => {
  // Cookie zaten 7 gün; client-side refresh gerekmiyor.
  next(new AppError(410, 'Refresh not needed; cookie session auto-renews.', 'AUTH_METHOD_REMOVED'));
});

// Cookie destroy. Logout sonrası toroscs login sayfasına yönlendirilir client.
authRoutes.post('/logout', async (req, res, next) => {
  try {
    const session = await readSession(req, res);
    session.destroy();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Lightweight session readback — frontend useAuth boot için.
authRoutes.get('/me', async (req, res, next) => {
  try {
    const session = await readSession(req, res);
    if (!session.isLoggedIn || !session.steamId) {
      throw new AppError(401, 'Not logged in', 'NOT_LOGGED_IN');
    }
    res.json({
      steamId: session.steamId,
      username: session.username ?? null,
      avatar: session.avatar ?? null,
      isAdmin: !!session.isAdmin,
      isVip: !!session.isVip,
    });
  } catch (error) {
    next(error);
  }
});
