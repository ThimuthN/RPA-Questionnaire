interface RateLimitEntry {
  lastTime: number;
  expiresAt: number;
}

// Use in-memory cache for local development, Redis for distributed deployments
const isRedisAvailable = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redisClient: any = null;
if (isRedisAvailable) {
  // Dynamically import only when Redis credentials are available
  try {
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.warn('Upstash Redis not available, using local cache:', error);
  }
}

const localCache = new Map<string, RateLimitEntry>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Cleanup expired local entries every minute
if (!isRedisAvailable) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of localCache.entries()) {
      if (entry.expiresAt < now) {
        localCache.delete(key);
      }
    }
  }, 1000 * 60);
}

async function checkRateLimit(key: string, windowMs: number): Promise<boolean> {
  const now = Date.now();

  if (redisClient) {
    // Redis-backed rate limiting (distributed)
    try {
      const lastTime = await redisClient.get(key);
      const lastValue = (lastTime as number) || 0;

      if (now - lastValue < windowMs) {
        return false;
      }

      await redisClient.setex(key, Math.ceil(CACHE_TTL / 1000), now);
      return true;
    } catch (error) {
      // Fallback to local cache if Redis fails
      console.error('Redis rate limit check failed, using local cache:', error);
    }
  }

  // Local cache fallback
  const entry = localCache.get(key);
  const lastTime = entry?.lastTime || 0;

  if (now - lastTime < windowMs) {
    return false;
  }

  localCache.set(key, { lastTime: now, expiresAt: now + CACHE_TTL });
  return true;
}

export async function checkAutosaveRateLimit(userId: string): Promise<boolean> {
  // Allow 1 autosave per 5 seconds max
  return checkRateLimit(`autosave:${userId}`, 5000);
}

export async function checkBulkOpRateLimit(userId: string): Promise<boolean> {
  // Allow 1 bulk operation per 30 seconds
  return checkRateLimit(`bulk:${userId}`, 30000);
}
