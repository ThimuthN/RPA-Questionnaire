// ── rate-limit.test.ts ────────────────────────────────────────────────────────
// Tests for checkAccountLockout / recordLoginFailure / clearLoginFailures and
// checkAuthRateLimit. Redis is kept unavailable (env vars absent) so all paths
// exercise the local in-memory Map fallback.
//
// Because isRedisAvailable and localCounters are evaluated at module-load time
// we use vi.resetModules() + dynamic import inside each beforeEach so every
// test block starts from a clean, empty Map and redisClient === null.

import { beforeEach, describe, expect, it, vi } from "vitest";

// Guarantee no Upstash env vars leak in from the shell / CI
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

// ── helpers ───────────────────────────────────────────────────────────────────

type RateLimitModule = typeof import("./rate-limit");

async function freshModule(): Promise<RateLimitModule> {
  vi.resetModules();
  return import("./rate-limit");
}

// ── checkAccountLockout ───────────────────────────────────────────────────────

describe("checkAccountLockout", () => {
  let mod: RateLimitModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await freshModule();
  });

  it("returns locked:false when no lockout entry exists", async () => {
    const result = await mod.checkAccountLockout("user@example.com");
    expect(result.locked).toBe(false);
  });

  it("returns locked:true with minutesRemaining after threshold failures", async () => {
    const email = "locked@example.com";
    // threshold=1 so a single failure triggers lockout, lockoutMs=60_000 (1 min)
    await mod.recordLoginFailure(email, 1, 60_000);

    const result = await mod.checkAccountLockout(email);
    expect(result.locked).toBe(true);
    if (result.locked) {
      expect(result.minutesRemaining).toBe(1);
      expect(result.unlocksAt).toBeInstanceOf(Date);
      expect(result.unlocksAt.getTime()).toBeGreaterThan(Date.now());
    }
  });

  it("is case-insensitive — Foo@Bar.com matches foo@bar.com", async () => {
    await mod.recordLoginFailure("Foo@Bar.com", 1, 60_000);

    const result = await mod.checkAccountLockout("foo@bar.com");
    expect(result.locked).toBe(true);
  });

  it("is case-insensitive — lockout set for foo@bar.com, checked with FOO@BAR.COM", async () => {
    await mod.recordLoginFailure("foo@bar.com", 1, 60_000);

    const result = await mod.checkAccountLockout("FOO@BAR.COM");
    expect(result.locked).toBe(true);
  });

  it("returns locked:false after lockout has expired", async () => {
    const email = "expired@example.com";
    // lockoutMs=1 ms — expires immediately
    await mod.recordLoginFailure(email, 1, 1);

    // Let the 1ms TTL expire
    await new Promise((r) => setTimeout(r, 10));

    const result = await mod.checkAccountLockout(email);
    expect(result.locked).toBe(false);
  });
});

// ── recordLoginFailure ────────────────────────────────────────────────────────

describe("recordLoginFailure", () => {
  let mod: RateLimitModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await freshModule();
  });

  it("does NOT lock after threshold-1 failures", async () => {
    const email = "almost@example.com";
    const threshold = 5;
    for (let i = 0; i < threshold - 1; i++) {
      await mod.recordLoginFailure(email, threshold, 60_000);
    }
    const result = await mod.checkAccountLockout(email);
    expect(result.locked).toBe(false);
  });

  it("DOES lock after exactly threshold failures", async () => {
    const email = "exact@example.com";
    const threshold = 3;
    for (let i = 0; i < threshold; i++) {
      await mod.recordLoginFailure(email, threshold, 60_000);
    }
    const result = await mod.checkAccountLockout(email);
    expect(result.locked).toBe(true);
  });

  it("DOES lock after more than threshold failures", async () => {
    const email = "over@example.com";
    const threshold = 3;
    for (let i = 0; i < threshold + 5; i++) {
      await mod.recordLoginFailure(email, threshold, 60_000);
    }
    const result = await mod.checkAccountLockout(email);
    expect(result.locked).toBe(true);
  });

  it("different emails do not interfere with each other", async () => {
    const threshold = 2;
    await mod.recordLoginFailure("alice@example.com", threshold, 60_000);
    await mod.recordLoginFailure("alice@example.com", threshold, 60_000);
    // alice is locked
    const alice = await mod.checkAccountLockout("alice@example.com");
    expect(alice.locked).toBe(true);

    // bob has zero failures — must not be locked
    const bob = await mod.checkAccountLockout("bob@example.com");
    expect(bob.locked).toBe(false);
  });

  it("lockout key TTL is approximately lockoutMs (within ±1 second)", async () => {
    const email = "ttl@example.com";
    const lockoutMs = 10_000; // 10 seconds
    const before = Date.now();
    await mod.recordLoginFailure(email, 1, lockoutMs);
    const after = Date.now();

    const result = await mod.checkAccountLockout(email);
    expect(result.locked).toBe(true);
    if (result.locked) {
      const expectedUnlock = before + lockoutMs;
      const tolerance = 1_000; // 1 s
      expect(result.unlocksAt.getTime()).toBeGreaterThanOrEqual(expectedUnlock - tolerance);
      expect(result.unlocksAt.getTime()).toBeLessThanOrEqual(after + lockoutMs + tolerance);
    }
  });
});

// ── clearLoginFailures ────────────────────────────────────────────────────────

describe("clearLoginFailures", () => {
  let mod: RateLimitModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await freshModule();
  });

  it("removes lockout so account is no longer locked", async () => {
    const email = "locked@example.com";
    await mod.recordLoginFailure(email, 1, 60_000);
    expect((await mod.checkAccountLockout(email)).locked).toBe(true);

    await mod.clearLoginFailures(email);

    expect((await mod.checkAccountLockout(email)).locked).toBe(false);
  });

  it("removes failure count so subsequent failures start from zero", async () => {
    const email = "reset@example.com";
    const threshold = 3;
    // Record threshold-1 failures (not yet locked)
    for (let i = 0; i < threshold - 1; i++) {
      await mod.recordLoginFailure(email, threshold, 60_000);
    }
    await mod.clearLoginFailures(email);

    // After clear: one more failure should NOT lock (counter reset to 1 of 3)
    await mod.recordLoginFailure(email, threshold, 60_000);
    expect((await mod.checkAccountLockout(email)).locked).toBe(false);
  });

  it("is safe to call when no failures exist (no-op)", async () => {
    await expect(mod.clearLoginFailures("ghost@example.com")).resolves.toBeUndefined();
  });

  it("does not affect a different email", async () => {
    const threshold = 1;
    await mod.recordLoginFailure("victim@example.com", threshold, 60_000);
    await mod.clearLoginFailures("other@example.com");

    expect((await mod.checkAccountLockout("victim@example.com")).locked).toBe(true);
  });
});

// ── integration: 10 failures → locked → clear → unlocked ─────────────────────

describe("lockout integration flow", () => {
  let mod: RateLimitModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await freshModule();
  });

  it("10 failures lock the account; clearLoginFailures unlocks it", async () => {
    const email = "integrate@example.com";
    const threshold = 10;

    for (let i = 0; i < threshold; i++) {
      await mod.recordLoginFailure(email, threshold, 30 * 60 * 1000);
    }

    const locked = await mod.checkAccountLockout(email);
    expect(locked.locked).toBe(true);
    if (locked.locked) {
      expect(locked.minutesRemaining).toBeGreaterThan(0);
    }

    await mod.clearLoginFailures(email);

    const after = await mod.checkAccountLockout(email);
    expect(after.locked).toBe(false);
  });
});

// ── checkAuthRateLimit ────────────────────────────────────────────────────────

describe("checkAuthRateLimit", () => {
  let mod: RateLimitModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await freshModule();
  });

  function makeRequest(ip: string): Request {
    return new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "x-forwarded-for": ip },
    });
  }

  it("returns ok:true for first request within limits", async () => {
    const result = await mod.checkAuthRateLimit({
      request: makeRequest("1.2.3.4"),
    });
    expect(result.ok).toBe(true);
  });

  it("returns ok:false when IP limit is exceeded", async () => {
    const ip = "10.0.0.1";
    const ipMax = 2;

    // Exhaust the IP quota
    for (let i = 0; i < ipMax; i++) {
      await mod.checkAuthRateLimit({ request: makeRequest(ip), ipMax });
    }

    // Next call should be rejected
    const result = await mod.checkAuthRateLimit({ request: makeRequest(ip), ipMax });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/too many attempts/i);
    }
  });

  it("returns ok:false when account (identifier) limit is exceeded", async () => {
    const ip = "10.0.0.2";
    const idMax = 2;
    const identifier = "account-limit@example.com";

    for (let i = 0; i < idMax; i++) {
      await mod.checkAuthRateLimit({ request: makeRequest(ip), identifier, idMax, ipMax: 100 });
    }

    const result = await mod.checkAuthRateLimit({
      request: makeRequest(ip),
      identifier,
      idMax,
      ipMax: 100,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/too many attempts/i);
    }
  });

  it("different IPs do not share quota", async () => {
    const ipMax = 1;
    await mod.checkAuthRateLimit({ request: makeRequest("5.5.5.5"), ipMax });
    // Different IP — should still be ok
    const result = await mod.checkAuthRateLimit({ request: makeRequest("6.6.6.6"), ipMax });
    expect(result.ok).toBe(true);
  });

  it("uses scope to isolate counters", async () => {
    const ip = "7.7.7.7";
    const ipMax = 1;
    // Exhaust scope A
    await mod.checkAuthRateLimit({ request: makeRequest(ip), scope: "scope-a", ipMax });
    // scope B counter is independent — must be ok
    const result = await mod.checkAuthRateLimit({
      request: makeRequest(ip),
      scope: "scope-b",
      ipMax,
    });
    expect(result.ok).toBe(true);
  });
});
