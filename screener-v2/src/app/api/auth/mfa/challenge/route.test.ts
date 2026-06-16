import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn()
}));

vi.mock("@/lib/auth/mfa-session", () => ({
  MFA_CHALLENGE_COOKIE: "mfa_challenge",
  verifyMfaChallengeToken: vi.fn(),
  clearMfaChallengeCookie: vi.fn(),
  setMfaDeviceCookie: vi.fn()
}));

vi.mock("@/lib/auth/mfa", () => ({
  verifyTotp: vi.fn(),
  verifyAndConsumeBackupCode: vi.fn(),
  parseBackupCodes: vi.fn(),
  serializeBackupCodes: vi.fn(),
  generateTrustedDeviceToken: vi.fn(),
  trustedDeviceExpiresAt: vi.fn(),
  parseDeviceLabel: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    mfaTrustedDevice: {
      create: vi.fn()
    }
  }
}));

vi.mock("@/lib/auth/session", () => ({
  createSessionToken: vi.fn(),
  setSessionCookie: vi.fn()
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn()
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  getEffectivePermissions: vi.fn()
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkAuthRateLimit: vi.fn()
}));

import { POST } from "./route";
import { cookies } from "next/headers";
import {
  verifyMfaChallengeToken,
  clearMfaChallengeCookie,
  setMfaDeviceCookie
} from "@/lib/auth/mfa-session";
import {
  verifyTotp,
  verifyAndConsumeBackupCode,
  parseBackupCodes,
  serializeBackupCodes,
  generateTrustedDeviceToken,
  trustedDeviceExpiresAt,
  parseDeviceLabel
} from "@/lib/auth/mfa";
import { prisma } from "@/lib/db/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { getEffectivePermissions } from "@/lib/auth/permission-evaluator";
import { checkAuthRateLimit } from "@/lib/server/rate-limit";

const MOCK_CHALLENGE = {
  userId: "user-1",
  email: "user@example.com",
  nextPath: "/dashboard",
  exp: Math.floor(Date.now() / 1000) + 600,
  t: "mfa" as const
};

const MOCK_USER = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  roleId: "role-1",
  departmentId: null,
  isActive: true,
  mfaEnabled: true,
  mfaSecret: "encrypted-secret",
  mfaBackupCodes: '["hash1","hash2","hash3"]',
  sessionVersion: 1
};

function makeFormRequest(fields: Record<string, string>, headers?: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return new Request("http://localhost/api/auth/mfa/challenge", {
    method: "POST",
    body: formData,
    headers
  });
}

describe("/api/auth/mfa/challenge POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "valid-challenge-token" })
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);

    vi.mocked(verifyMfaChallengeToken).mockResolvedValue(MOCK_CHALLENGE);
    vi.mocked(checkAuthRateLimit).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(MOCK_USER as never);
    vi.mocked(verifyTotp).mockReturnValue(true);
    vi.mocked(parseBackupCodes).mockReturnValue(["hash1", "hash2", "hash3"]);
    vi.mocked(serializeBackupCodes).mockReturnValue('["hash2","hash3"]');
    vi.mocked(getEffectivePermissions).mockResolvedValue(["view_candidates"]);
    vi.mocked(createSessionToken).mockResolvedValue("new-session-token");
    vi.mocked(setSessionCookie).mockImplementation(() => undefined);
    vi.mocked(clearMfaChallengeCookie).mockImplementation(() => undefined);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  describe("valid TOTP code", () => {
    it("redirects to the challenge nextPath on success", async () => {
      const response = await POST(makeFormRequest({ code: "123456" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("sets the session cookie on the redirect response", async () => {
      await POST(makeFormRequest({ code: "123456" }));

      expect(vi.mocked(setSessionCookie)).toHaveBeenCalledWith(
        expect.anything(),
        "new-session-token"
      );
    });

    it("clears the MFA challenge cookie after successful verification", async () => {
      await POST(makeFormRequest({ code: "123456" }));

      expect(vi.mocked(clearMfaChallengeCookie)).toHaveBeenCalled();
    });

    it("logs mfa_challenge_passed audit event", async () => {
      await POST(makeFormRequest({ code: "123456" }));

      expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "mfa_challenge_passed",
          actorId: "user-1",
          targetId: "user-1",
          targetType: "user"
        })
      );
    });

    it("strips whitespace from code before calling verifyTotp", async () => {
      await POST(makeFormRequest({ code: "123 456" }));

      expect(vi.mocked(verifyTotp)).toHaveBeenCalledWith("encrypted-secret", "123456");
    });
  });

  describe("invalid TOTP code", () => {
    it("redirects to /auth/mfa with an error query param", async () => {
      vi.mocked(verifyTotp).mockReturnValue(false);
      vi.mocked(verifyAndConsumeBackupCode).mockReturnValue({
        valid: false,
        remaining: ["hash1", "hash2", "hash3"]
      });

      const response = await POST(makeFormRequest({ code: "000000" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/auth/mfa");
      expect(response.headers.get("location")).toContain("error=");
    });

    it("does not set a session cookie when code is invalid", async () => {
      vi.mocked(verifyTotp).mockReturnValue(false);
      vi.mocked(verifyAndConsumeBackupCode).mockReturnValue({
        valid: false,
        remaining: ["hash1", "hash2", "hash3"]
      });

      await POST(makeFormRequest({ code: "000000" }));

      expect(vi.mocked(setSessionCookie)).not.toHaveBeenCalled();
    });

    it("logs mfa_challenge_failed audit event on bad code", async () => {
      vi.mocked(verifyTotp).mockReturnValue(false);
      vi.mocked(verifyAndConsumeBackupCode).mockReturnValue({
        valid: false,
        remaining: []
      });

      await POST(makeFormRequest({ code: "000000" }));

      expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "mfa_challenge_failed",
          actorId: "user-1"
        })
      );
    });
  });

  describe("valid backup code (8-char)", () => {
    beforeEach(() => {
      vi.mocked(verifyTotp).mockReturnValue(false);
      vi.mocked(verifyAndConsumeBackupCode).mockReturnValue({
        valid: true,
        remaining: ["hash2", "hash3"]
      });
    });

    it("grants a session when a valid backup code is used", async () => {
      const response = await POST(makeFormRequest({ code: "AAAABBBB" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/dashboard");
      expect(vi.mocked(setSessionCookie)).toHaveBeenCalled();
    });

    it("consumes the backup code (removes it from stored hashes)", async () => {
      await POST(makeFormRequest({ code: "AAAABBBB" }));

      expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({ mfaBackupCodes: expect.any(String) })
        })
      );
    });

    it("logs mfa_backup_code_used audit event with remaining count", async () => {
      await POST(makeFormRequest({ code: "AAAABBBB" }));

      expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "mfa_backup_code_used",
          actorId: "user-1",
          after: expect.objectContaining({ remainingCodes: 2 })
        })
      );
    });

    it("does not attempt backup code when TOTP succeeded", async () => {
      vi.mocked(verifyTotp).mockReturnValue(true);

      await POST(makeFormRequest({ code: "123456" }));

      expect(vi.mocked(verifyAndConsumeBackupCode)).not.toHaveBeenCalled();
    });
  });

  describe("expired or missing challenge cookie", () => {
    it("redirects to /login with session expired error when no cookie present", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined)
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);
      vi.mocked(verifyMfaChallengeToken).mockResolvedValue(null);

      const response = await POST(makeFormRequest({ code: "123456" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/login");
      expect(response.headers.get("location")).toContain("error=");
    });

    it("redirects to /login when challenge token is expired/invalid", async () => {
      vi.mocked(verifyMfaChallengeToken).mockResolvedValue(null);

      const response = await POST(makeFormRequest({ code: "123456" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("does not set a session cookie when challenge token is invalid", async () => {
      vi.mocked(verifyMfaChallengeToken).mockResolvedValue(null);

      await POST(makeFormRequest({ code: "123456" }));

      expect(vi.mocked(setSessionCookie)).not.toHaveBeenCalled();
    });
  });

  describe("rate limiting", () => {
    it("redirects to /auth/mfa with error when rate limit is exceeded", async () => {
      vi.mocked(checkAuthRateLimit).mockResolvedValue({ ok: false } as never);

      const response = await POST(makeFormRequest({ code: "123456" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/auth/mfa");
      expect(response.headers.get("location")).toContain("error=");
    });
  });

  describe("user account state edge cases", () => {
    it("redirects to /login when user is not found in DB", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await POST(makeFormRequest({ code: "123456" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("redirects to /login when user account is inactive", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...MOCK_USER,
        isActive: false
      } as never);

      const response = await POST(makeFormRequest({ code: "123456" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("redirects to /login when user has MFA disabled", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...MOCK_USER,
        mfaEnabled: false
      } as never);

      const response = await POST(makeFormRequest({ code: "123456" }));

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("/login");
    });
  });

  describe("trust device", () => {
    beforeEach(() => {
      vi.mocked(generateTrustedDeviceToken).mockReturnValue({
        token: "device-token-abc",
        tokenHash: "device-hash-abc"
      });
      vi.mocked(trustedDeviceExpiresAt).mockReturnValue(new Date("2026-07-17"));
      vi.mocked(parseDeviceLabel).mockReturnValue("Chrome on Windows");
      vi.mocked(prisma.mfaTrustedDevice.create).mockResolvedValue({} as never);
      vi.mocked(setMfaDeviceCookie).mockImplementation(() => undefined);
    });

    it("creates a trusted device record and sets device cookie when trustDevice=true", async () => {
      const response = await POST(
        makeFormRequest(
          { code: "123456", trustDevice: "true" },
          { "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0" }
        )
      );

      expect(response.status).toBe(303);
      expect(vi.mocked(prisma.mfaTrustedDevice.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            tokenHash: "device-hash-abc",
            deviceLabel: "Chrome on Windows",
            expiresAt: expect.any(Date)
          })
        })
      );
      expect(vi.mocked(setMfaDeviceCookie)).toHaveBeenCalledWith(
        expect.anything(),
        "device-token-abc"
      );
    });

    it("logs mfa_device_trusted audit event when device is trusted", async () => {
      await POST(makeFormRequest({ code: "123456", trustDevice: "true" }));

      expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "mfa_device_trusted",
          actorId: "user-1",
          after: expect.objectContaining({ deviceLabel: "Chrome on Windows" })
        })
      );
    });

    it("does not create a trusted device when trustDevice is not set", async () => {
      await POST(makeFormRequest({ code: "123456" }));

      expect(vi.mocked(prisma.mfaTrustedDevice.create)).not.toHaveBeenCalled();
      expect(vi.mocked(setMfaDeviceCookie)).not.toHaveBeenCalled();
    });
  });
});
