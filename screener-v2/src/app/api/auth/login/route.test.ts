import { beforeEach, describe, expect, it, vi } from "vitest";

// All vi.mock() calls MUST precede any imports
vi.mock("next/headers", () => ({
  cookies: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    mfaTrustedDevice: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("@/lib/auth/app-auth", () => ({
  authenticateAppUser: vi.fn(),
  ensureBootstrapAdmin: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  createSessionToken: vi.fn(),
  sanitizeNextPath: vi.fn((next?: string) => next ?? "/"),
  setSessionCookie: vi.fn()
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkAuthRateLimit: vi.fn(),
  checkAccountLockout: vi.fn(),
  recordLoginFailure: vi.fn(),
  clearLoginFailures: vi.fn()
}));

vi.mock("@/lib/auth/security-settings", () => ({
  getOrgSecuritySettings: vi.fn()
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn()
}));

vi.mock("@/lib/auth/mfa-session", () => ({
  MFA_DEVICE_COOKIE: "mfa_device",
  createMfaChallengeToken: vi.fn(),
  setMfaChallengeCookie: vi.fn()
}));

vi.mock("@/lib/auth/mfa", () => ({
  hashDeviceToken: vi.fn()
}));

vi.mock("@/lib/server/logger", () => ({
  createRequestLogContext: vi.fn(() => ({ requestId: "req-test-123" })),
  logRouteError: vi.fn(),
  messageFromError: vi.fn((err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback
  )
}));

import { POST } from "./route";
import { authenticateAppUser, ensureBootstrapAdmin } from "@/lib/auth/app-auth";
import { createSessionToken, sanitizeNextPath, setSessionCookie } from "@/lib/auth/session";
import {
  checkAuthRateLimit,
  checkAccountLockout,
  recordLoginFailure,
  clearLoginFailures
} from "@/lib/server/rate-limit";
import { getOrgSecuritySettings } from "@/lib/auth/security-settings";
import { logAudit } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";
import { createMfaChallengeToken, setMfaChallengeCookie } from "@/lib/auth/mfa-session";
import { hashDeviceToken } from "@/lib/auth/mfa";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonRequest(body: Record<string, unknown>, extraHeaders: Record<string, string> = {}) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body)
  });
}

function formRequest(fields: Record<string, string>) {
  const params = new URLSearchParams(fields);
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
}

const DEFAULT_SESSION = {
  userId: "user-1",
  email: "alice@example.com",
  name: "Alice",
  roleId: "role-1",
  departmentId: "dept-1",
  permissions: ["view_candidates"],
  sv: 1
};

const DEFAULT_SECURITY_SETTINGS = {
  lockoutThreshold: 10,
  lockoutMinutes: 30
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(ensureBootstrapAdmin).mockResolvedValue(undefined);
    vi.mocked(checkAuthRateLimit).mockResolvedValue({ ok: true } as never);
    vi.mocked(checkAccountLockout).mockResolvedValue({ locked: false } as never);
    vi.mocked(getOrgSecuritySettings).mockResolvedValue(DEFAULT_SECURITY_SETTINGS as never);
    vi.mocked(authenticateAppUser).mockResolvedValue(DEFAULT_SESSION as never);
    vi.mocked(createSessionToken).mockResolvedValue("session-token-xyz");
    vi.mocked(sanitizeNextPath).mockImplementation((next?: string) => next ?? "/");
    vi.mocked(setSessionCookie).mockReturnValue(undefined);
    vi.mocked(clearLoginFailures).mockResolvedValue(undefined);
    vi.mocked(logAudit).mockResolvedValue(undefined);
    vi.mocked(recordLoginFailure).mockResolvedValue(undefined);

    // Default: no MFA on user
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      mfaEnabled: false,
      sessionVersion: 1
    } as never);

    // Default: no trusted device
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);
  });

  // -------------------------------------------------------------------------
  // Happy path — no MFA
  // -------------------------------------------------------------------------

  describe("successful login (no MFA)", () => {
    it("returns 200 with ok:true and calls setSessionCookie", async () => {
      const response = await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(setSessionCookie).toHaveBeenCalledWith(expect.anything(), "session-token-xyz");
    });

    it("calls clearLoginFailures after successful auth", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(clearLoginFailures).toHaveBeenCalledWith("alice@example.com");
    });

    it("calls createSessionToken with session fields", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(createSessionToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          email: "alice@example.com"
        })
      );
    });

    it("respects next path in JSON body", async () => {
      vi.mocked(sanitizeNextPath).mockReturnValueOnce("/dashboard");
      const response = await POST(
        jsonRequest({ email: "alice@example.com", password: "secret", next: "/dashboard" })
      );
      const data = await response.json();
      expect(data.next).toBe("/dashboard");
    });
  });

  // -------------------------------------------------------------------------
  // Failed login
  // -------------------------------------------------------------------------

  describe("failed login (bad credentials)", () => {
    beforeEach(() => {
      vi.mocked(authenticateAppUser).mockResolvedValue(null);
    });

    it("returns 401 with error message", async () => {
      const response = await POST(jsonRequest({ email: "alice@example.com", password: "wrong" }));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.message).toContain("Invalid email or password");
    });

    it("calls logAudit with user_login_failed", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "wrong" }));

      // logAudit is fire-and-forget (void); wait for microtasks
      await new Promise((r) => setTimeout(r, 10));
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "user_login_failed", actorEmail: "alice@example.com" })
      );
    });

    it("calls recordLoginFailure", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "wrong" }));

      await new Promise((r) => setTimeout(r, 10));
      expect(recordLoginFailure).toHaveBeenCalledWith(
        "alice@example.com",
        DEFAULT_SECURITY_SETTINGS.lockoutThreshold,
        expect.any(Number)
      );
    });

    it("does NOT call setSessionCookie on failed auth", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "wrong" }));
      expect(setSessionCookie).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------

  describe("rate limiting", () => {
    it("returns 429 with rate limit message when IP is rate limited", async () => {
      vi.mocked(checkAuthRateLimit).mockResolvedValue({
        ok: false,
        message: "Too many requests. Please try again later."
      } as never);

      const response = await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.ok).toBe(false);
      expect(data.message).toMatch(/too many/i);
    });

    it("does NOT call authenticateAppUser when rate limited", async () => {
      vi.mocked(checkAuthRateLimit).mockResolvedValue({
        ok: false,
        message: "Rate limit exceeded."
      } as never);

      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(authenticateAppUser).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Account lockout
  // -------------------------------------------------------------------------

  describe("account lockout", () => {
    it("returns 429 with minutes remaining message when account is locked", async () => {
      vi.mocked(checkAccountLockout).mockResolvedValue({
        locked: true,
        minutesRemaining: 15
      } as never);

      const response = await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.ok).toBe(false);
      expect(data.message).toContain("15 minute");
    });

    it("does NOT call authenticateAppUser when account is locked", async () => {
      vi.mocked(checkAccountLockout).mockResolvedValue({
        locked: true,
        minutesRemaining: 5
      } as never);

      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(authenticateAppUser).not.toHaveBeenCalled();
    });

    it("uses singular 'minute' when minutesRemaining is 1", async () => {
      vi.mocked(checkAccountLockout).mockResolvedValue({
        locked: true,
        minutesRemaining: 1
      } as never);

      const response = await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      const data = await response.json();
      expect(data.message).toContain("1 minute.");
    });
  });

  // -------------------------------------------------------------------------
  // Validation errors
  // -------------------------------------------------------------------------

  describe("request validation", () => {
    it("returns 400 for a malformed email address", async () => {
      const response = await POST(jsonRequest({ email: "not-an-email", password: "secret" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("returns 400 when password is missing", async () => {
      const response = await POST(jsonRequest({ email: "alice@example.com" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("returns 400 when body is not valid JSON", async () => {
      const response = await POST(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "this is not json{"
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // MFA — valid trusted device (skip MFA)
  // -------------------------------------------------------------------------

  describe("MFA with valid trusted device", () => {
    const DEVICE_TOKEN = "trusted-device-token-abc";
    const DEVICE_HASH = "hashed-device-token-abc";

    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        mfaEnabled: true,
        sessionVersion: 2
      } as never);

      const mockCookieStore = {
        get: vi.fn((name: string) => (name === "mfa_device" ? { value: DEVICE_TOKEN } : undefined))
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);
      vi.mocked(hashDeviceToken).mockReturnValue(DEVICE_HASH);
      vi.mocked(prisma.mfaTrustedDevice.findUnique).mockResolvedValue({
        id: "device-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days from now
      } as never);
      vi.mocked(prisma.mfaTrustedDevice.update).mockResolvedValue({} as never);
    });

    it("grants full session without redirecting to /auth/mfa", async () => {
      const response = await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(setSessionCookie).toHaveBeenCalled();
      expect(createMfaChallengeToken).not.toHaveBeenCalled();
    });

    it("updates lastUsedAt on the trusted device record", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(prisma.mfaTrustedDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "device-1" } })
      );
    });

    it("logs audit as password+trusted_device method", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      await new Promise((r) => setTimeout(r, 10));
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "user_login",
          after: { method: "password+trusted_device" }
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // MFA — expired device token
  // -------------------------------------------------------------------------

  describe("MFA with expired trusted device", () => {
    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        mfaEnabled: true,
        sessionVersion: 2
      } as never);

      const mockCookieStore = {
        get: vi.fn((name: string) =>
          name === "mfa_device" ? { value: "some-device-token" } : undefined
        )
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);
      vi.mocked(hashDeviceToken).mockReturnValue("hashed-expired");
      vi.mocked(prisma.mfaTrustedDevice.findUnique).mockResolvedValue({
        id: "device-old",
        userId: "user-1",
        expiresAt: new Date(Date.now() - 1000) // already expired
      } as never);
      vi.mocked(createMfaChallengeToken).mockResolvedValue("mfa-challenge-token");
    });

    it("redirects to /auth/mfa when device token is expired", async () => {
      const response = await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));

      expect(response.status).toBe(303);
      const location = response.headers.get("location");
      expect(location).toContain("/auth/mfa");
    });

    it("calls setMfaChallengeCookie with challenge token", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(setMfaChallengeCookie).toHaveBeenCalledWith(expect.anything(), "mfa-challenge-token");
    });

    it("does NOT grant a full session cookie", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(setSessionCookie).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // MFA — no device cookie at all
  // -------------------------------------------------------------------------

  describe("MFA with no device cookie", () => {
    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        mfaEnabled: true,
        sessionVersion: 2
      } as never);

      const mockCookieStore = { get: vi.fn().mockReturnValue(undefined) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);
      vi.mocked(createMfaChallengeToken).mockResolvedValue("mfa-challenge-token-2");
    });

    it("redirects to /auth/mfa", async () => {
      const response = await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));

      expect(response.status).toBe(303);
      const location = response.headers.get("location");
      expect(location).toContain("/auth/mfa");
    });

    it("does NOT call setSessionCookie", async () => {
      await POST(jsonRequest({ email: "alice@example.com", password: "secret" }));
      expect(setSessionCookie).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Form request (Content-Type: application/x-www-form-urlencoded)
  // -------------------------------------------------------------------------

  describe("form request handling", () => {
    it("redirects to /login?error=... on failed auth (form request)", async () => {
      vi.mocked(authenticateAppUser).mockResolvedValue(null);

      const response = await POST(
        formRequest({ email: "alice@example.com", password: "wrong" })
      );

      expect(response.status).toBe(303);
      const location = response.headers.get("location") ?? "";
      expect(location).toContain("/login");
      expect(location).toContain("error=");
    });

    it("redirects to /login?error=... when rate limited (form request)", async () => {
      vi.mocked(checkAuthRateLimit).mockResolvedValue({
        ok: false,
        message: "Rate limit exceeded."
      } as never);

      const response = await POST(
        formRequest({ email: "alice@example.com", password: "secret" })
      );

      expect(response.status).toBe(303);
      const location = response.headers.get("location") ?? "";
      expect(location).toContain("/login");
      expect(location).toContain("error=");
    });

    it("redirects to /login?error=... when account is locked (form request)", async () => {
      vi.mocked(checkAccountLockout).mockResolvedValue({
        locked: true,
        minutesRemaining: 10
      } as never);

      const response = await POST(
        formRequest({ email: "alice@example.com", password: "secret" })
      );

      expect(response.status).toBe(303);
      const location = response.headers.get("location") ?? "";
      expect(location).toContain("/login");
      expect(location).toContain("error=");
    });

    it("redirects to nextPath on successful form login (no MFA)", async () => {
      vi.mocked(sanitizeNextPath).mockReturnValue("/app/dashboard");

      const response = await POST(
        formRequest({ email: "alice@example.com", password: "secret", next: "/app/dashboard" })
      );

      expect(response.status).toBe(303);
      const location = response.headers.get("location") ?? "";
      expect(location).toContain("/app/dashboard");
    });
  });
});
