import type { Redis } from '@upstash/redis';

interface RateLimitEntry {
  lastTime: number;
  expiresAt: number;
}

type PublicApplicationRateLimitResult =
  | { ok: true }
  | { ok: false; message: string };

// Use in-memory cache for local development, Redis for distributed deployments
const isRedisAvailable = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redisClient: Redis | null = null;
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

interface CounterEntry {
  count: number;
  expiresAt: number;
}
const localCounters = new Map<string, CounterEntry>();

// Cleanup expired local entries every minute
if (!isRedisAvailable) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of localCache.entries()) {
      if (entry.expiresAt < now) {
        localCache.delete(key);
      }
    }
    for (const [key, entry] of localCounters.entries()) {
      if (entry.expiresAt < now) {
        localCounters.delete(key);
      }
    }
  }, 1000 * 60);
}

/**
 * Fixed-window counter: returns the attempt count within the window after incrementing.
 * Unlike checkRateLimit (a single-action debounce), this allows N attempts per window —
 * the right shape for login/brute-force protection where a couple of typos are normal.
 */
async function incrWindow(key: string, windowMs: number): Promise<number> {
  const now = Date.now();

  if (redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.pexpire(key, windowMs);
      }
      return count;
    } catch (error) {
      console.error("Redis counter failed, using local cache:", error);
    }
  }

  const entry = localCounters.get(key);
  if (!entry || entry.expiresAt < now) {
    localCounters.set(key, { count: 1, expiresAt: now + windowMs });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

type AuthRateLimitResult = { ok: true } | { ok: false; message: string };

/**
 * Brute-force protection for authentication endpoints.
 * Per-IP and (optionally) per-account fixed windows. Defaults: 20 / 5min per IP, 8 / 5min per account.
 */
export async function checkAuthRateLimit(args: {
  request: Request;
  identifier?: string;
  scope?: string;
  ipMax?: number;
  idMax?: number;
  windowMs?: number;
}): Promise<AuthRateLimitResult> {
  const scope = args.scope ?? "auth";
  const windowMs = args.windowMs ?? 5 * 60 * 1000;
  const ipMax = args.ipMax ?? 20;
  const idMax = args.idMax ?? 8;
  const ip = requestIp(args.request);
  const id = args.identifier?.trim().toLowerCase();

  const [ipCount, idCount] = await Promise.all([
    incrWindow(`${scope}:ip:${ip}`, windowMs),
    id ? incrWindow(`${scope}:id:${id}`, windowMs) : Promise.resolve(0)
  ]);

  if (ipCount > ipMax || idCount > idMax) {
    return {
      ok: false,
      message: "Too many attempts. Please wait a few minutes before trying again."
    };
  }
  return { ok: true };
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

function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

// ── Account lockout ──────────────────────────────────────────────────────────
// After N consecutive failed logins the account is hard-locked for M minutes —
// regardless of IP. This is separate from IP-based rate limiting and matches
// Greenhouse / Lever / Workday enterprise ATS behaviour.

const lockoutKey = (email: string) => `lockout:${email.toLowerCase().trim()}`;
const failCountKey = (email: string) => `loginfail:${email.toLowerCase().trim()}`;

export type LockoutCheckResult =
  | { locked: false }
  | { locked: true; unlocksAt: Date; minutesRemaining: number };

export async function checkAccountLockout(email: string): Promise<LockoutCheckResult> {
  const key = lockoutKey(email);

  if (redisClient) {
    try {
      const ttl = await redisClient.ttl(key); // seconds remaining, -2 if key absent
      if (ttl > 0) {
        return {
          locked: true,
          unlocksAt: new Date(Date.now() + ttl * 1000),
          minutesRemaining: Math.ceil(ttl / 60)
        };
      }
      return { locked: false };
    } catch { /* fall through to local */ }
  }

  const entry = localCounters.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    const msRemaining = entry.expiresAt - Date.now();
    return {
      locked: true,
      unlocksAt: new Date(entry.expiresAt),
      minutesRemaining: Math.ceil(msRemaining / 60_000)
    };
  }
  return { locked: false };
}

export async function recordLoginFailure(
  email: string,
  threshold = 10,
  lockoutMs = 30 * 60 * 1000
): Promise<void> {
  const fKey = failCountKey(email);
  const lKey = lockoutKey(email);
  const count = await incrWindow(fKey, lockoutMs);
  if (count >= threshold) {
    if (redisClient) {
      try {
        await redisClient.set(lKey, "1", { px: lockoutMs });
        return;
      } catch { /* fall through */ }
    }
    localCounters.set(lKey, { count: 1, expiresAt: Date.now() + lockoutMs });
  }
}

export async function clearLoginFailures(email: string): Promise<void> {
  const fKey = failCountKey(email);
  const lKey = lockoutKey(email);
  if (redisClient) {
    try {
      await Promise.all([redisClient.del(fKey), redisClient.del(lKey)]);
      return;
    } catch { /* fall through */ }
  }
  localCounters.delete(fKey);
  localCounters.delete(lKey);
}

export async function checkPublicApplicationRateLimit(args: {
  request: Request;
  jobSlug: string;
  email: string;
}): Promise<PublicApplicationRateLimitResult> {
  const ip = requestIp(args.request);
  const normalizedEmail = args.email.trim().toLowerCase();

  const [ipAllowed, emailAllowed] = await Promise.all([
    checkRateLimit(`public-apply:ip:${args.jobSlug}:${ip}`, 60_000),
    checkRateLimit(`public-apply:email:${args.jobSlug}:${normalizedEmail}`, 60_000)
  ]);

  if (!ipAllowed || !emailAllowed) {
    return {
      ok: false,
      message: "Please wait a minute before submitting this application again."
    };
  }

  return { ok: true };
}
