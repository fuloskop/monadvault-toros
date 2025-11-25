import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

// Redis key prefixes
export const REDIS_KEYS = {
  CRASH_CURRENT: 'crash:current',
  CRASH_BETS: 'crash:bets',
  USER_SESSION: (userId: string) => `session:${userId}`,
  USER_BALANCE: (userId: string, currency: string) => `balance:${userId}:${currency}`,
  NONCE: (userId: string) => `nonce:${userId}`,
  RATE_LIMIT: (ip: string) => `ratelimit:${ip}`,
  ONLINE_USERS: 'online:users',
  CHAT_ROOM: (room: string) => `chat:${room}`,
  LIVE_FEED: 'live:feed',
  RAIN_ACTIVE: 'rain:active',
} as const;

