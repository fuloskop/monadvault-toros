import { getIronSession, type SessionOptions } from 'iron-session';
import type { Request, Response } from 'express';

// TOROS fork: iron-session config'i bilinçli olarak toroscs/src/lib/session.ts
// ile birebir aynı. Aynı SESSION_SECRET, aynı cookieName, aynı SessionData
// shape → torosclan.com (toroscs) tarafından set edilen cookie, games backend
// (path: /games) tarafından decrypt edilip okunabiliyor. Aynı domain altında
// olduğumuz için tarayıcı cookie'yi otomatik gönderiyor.
//
// Login akışı games backend'de implement edilmiyor. Nginx /games/api/auth/*
// path'ini doğrudan toroscs'a proxy'liyor; Steam OpenID flow orada çalışıyor,
// callback cookie'yi torosclan.com domain'ine set ediyor. Games backend
// sadece read-only cookie consumer.

export interface SessionData {
  steamId?: string;
  username?: string;
  avatar?: string;
  profileUrl?: string;
  isAdmin?: boolean;
  isSystemAdmin?: boolean;
  isVip?: boolean;
  isLoggedIn: boolean;
  openidState?: string;
}

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) {
    if (s.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters');
    }
    return s;
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test-only-session-secret-padded-to-32-or-more-chars-here';
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[session] SESSION_SECRET not set — using insecure dev-only default; set it in .env'
    );
    return 'INSECURE-dev-default-toroscs-please-set-SESSION_SECRET-in-env';
  }
  throw new Error('SESSION_SECRET env var must be set in production');
}

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: 'toroscs_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function readSession(req: Request, res: Response) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}
