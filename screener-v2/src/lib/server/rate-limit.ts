interface RateLimitEntry {
  lastTime: number;
  expiresAt: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.expiresAt < now) {
      rateLimitCache.delete(key);
    }
  }
}, 1000 * 60);

export function checkAutosaveRateLimit(userId: string): boolean {
  const key = `autosave:${userId}`;
  const now = Date.now();
  const entry = rateLimitCache.get(key);
  const lastAutosave = entry?.lastTime || 0;

  // Allow 1 autosave per 5 seconds max
  if (now - lastAutosave < 5000) {
    return false;
  }

  rateLimitCache.set(key, { lastTime: now, expiresAt: now + CACHE_TTL });
  return true;
}

export function checkBulkOpRateLimit(userId: string): boolean {
  const key = `bulk:${userId}`;
  const now = Date.now();
  const entry = rateLimitCache.get(key);
  const lastOp = entry?.lastTime || 0;

  // Allow 1 bulk operation per 30 seconds
  if (now - lastOp < 30000) {
    return false;
  }

  rateLimitCache.set(key, { lastTime: now, expiresAt: now + CACHE_TTL });
  return true;
}
