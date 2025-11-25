import { Request, Response, NextFunction } from 'express';
import { redis, REDIS_KEYS } from '../config/redis.js';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '100');

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = REDIS_KEYS.RATE_LIMIT(ip);

  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.pexpire(key, WINDOW_MS);
    }

    if (current > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil(WINDOW_MS / 1000),
      });
    }

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));

    next();
  } catch (error) {
    // If Redis fails, allow the request
    console.error('Rate limiter error:', error);
    next();
  }
}

// Stricter rate limit for auth endpoints
export async function authRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${REDIS_KEYS.RATE_LIMIT(ip)}:auth`;

  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.pexpire(key, 60000); // 1 minute window
    }

    if (current > 10) { // 10 auth attempts per minute
      return res.status(429).json({
        error: 'Too many authentication attempts',
        code: 'AUTH_RATE_LIMITED',
        retryAfter: 60,
      });
    }

    next();
  } catch (error) {
    console.error('Auth rate limiter error:', error);
    next();
  }
}

// Game action rate limit
export async function gameRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req as any).user?.id;
  if (!userId) {
    return next();
  }

  const key = `${REDIS_KEYS.RATE_LIMIT(userId)}:game`;

  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.pexpire(key, 1000); // 1 second window
    }

    if (current > 5) { // 5 game actions per second
      return res.status(429).json({
        error: 'Slow down! Too many game actions',
        code: 'GAME_RATE_LIMITED',
        retryAfter: 1,
      });
    }

    next();
  } catch (error) {
    console.error('Game rate limiter error:', error);
    next();
  }
}

