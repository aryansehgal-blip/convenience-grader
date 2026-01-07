import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 10,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  retryStrategy(times) {
    if (times > 10) {
      return null; // Stop retrying after 10 attempts
    }
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('✓ Connected to Redis');
});

export default redis;

// Helper functions for caching
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const value = await redis.incr(key);
    if (ttlSeconds && value === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return value;
  },
};
