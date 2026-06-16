import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn()
    }
  }
}));

vi.mock("@/lib/auth/user-tokens", () => ({
  consumeUserAuthToken: vi.fn()
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(),
  validatePasswordStrength: vi.fn()
}));

vi.mock("@/lib/auth/security-settings", () => ({
  getOrgSecuritySettings: vi.fn(),
  extractPasswordPolicy: vi.fn()
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn()
}));

import { POST } from "./route";
import { consumeUserAuthToken } from "@/lib/auth/user-tokens";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { getOrgSecuritySettings, extractPasswordPolicy } from "@/lib/auth/security-settings";
import { logAudit } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

const DEFAULT_SECURITY_SETTINGS = { minLength: 8, requireUppercase: false };
const DEFAULT_PASSWORD_POLICY = { minLength: 8 };

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getOrgSecuritySettings).mockResolvedValue(DEFAULT_SECURITY_SETTINGS as never);
    vi.mocked(extractPasswordPolicy).mockReturnValue(DEFAULT_PASSWORD_POLICY as never);
    vi.mocked(consumeUserAuthToken).mockResolvedValue({ ok: true, userId: "user-1" } as never);
    vi.mocked(validatePasswordStrength).mockReturnValue({ ok: true } as never);
    vi.mocked(hashPassword).mockReturnValue("hashed-pw");
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-1",
      email: "alice@example.com"
    } as never);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe("valid token + strong password", () => {
    it("returns 200 with ok:true and next:/login?reset=1", async () => {
      const response = await POST(
        jsonRequest({ token: "valid-reset-token-123", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.next).toBe("/login?reset=1");
    });

    it("calls prisma.user.update to hash and save the new password", async () => {
      await POST(jsonRequest({ token: "valid-reset-token-123", password: "StrongPass1!" }));

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({
            passwordHash: "hashed-pw"
          })
        })
      );
    });

    it("increments sessionVersion to invalidate all existing sessions", async () => {
      await POST(jsonRequest({ token: "valid-reset-token-123", password: "StrongPass1!" }));

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionVersion: { increment: 1 }
          })
        })
      );
    });

    it("calls logAudit with user_password_reset", async () => {
      await POST(jsonRequest({ token: "valid-reset-token-123", password: "StrongPass1!" }));

      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "user_password_reset",
          actorId: "user-1",
          actorEmail: "alice@example.com",
          targetType: "user"
        })
      );
    });

    it("passes the body password through hashPassword", async () => {
      await POST(jsonRequest({ token: "valid-reset-token-123", password: "MyPass999" }));
      expect(hashPassword).toHaveBeenCalledWith("MyPass999");
    });
  });

  // -------------------------------------------------------------------------
  // Invalid token
  // -------------------------------------------------------------------------

  describe("invalid or expired token", () => {
    it("returns 400 with the reason from consumeUserAuthToken", async () => {
      vi.mocked(consumeUserAuthToken).mockResolvedValue({
        ok: false,
        reason: "Token expired or already used."
      } as never);

      const response = await POST(
        jsonRequest({ token: "bad-token-xyz", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.message).toBe("Token expired or already used.");
    });

    it("does NOT call prisma.user.update when token is invalid", async () => {
      vi.mocked(consumeUserAuthToken).mockResolvedValue({
        ok: false,
        reason: "Invalid token."
      } as never);

      await POST(jsonRequest({ token: "bad-token-xyz", password: "StrongPass1!" }));
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Weak password
  // -------------------------------------------------------------------------

  describe("password strength validation", () => {
    it("returns 400 with strength failure message when password is too weak", async () => {
      vi.mocked(validatePasswordStrength).mockReturnValue({
        ok: false,
        message: "Password must be at least 8 characters."
      } as never);

      const response = await POST(
        jsonRequest({ token: "valid-reset-token-123", password: "weak" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.message).toContain("at least 8 characters");
    });

    it("does NOT call prisma.user.update when password is weak", async () => {
      vi.mocked(validatePasswordStrength).mockReturnValue({
        ok: false,
        message: "Too short."
      } as never);

      await POST(jsonRequest({ token: "valid-reset-token-123", password: "x" }));
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("passes the extracted password policy to validatePasswordStrength", async () => {
      await POST(jsonRequest({ token: "valid-reset-token-123", password: "StrongPass1!" }));
      expect(validatePasswordStrength).toHaveBeenCalledWith("StrongPass1!", DEFAULT_PASSWORD_POLICY);
    });
  });

  // -------------------------------------------------------------------------
  // Schema validation (Zod)
  // -------------------------------------------------------------------------

  describe("request body validation", () => {
    it("returns 400 when token is too short (< 8 chars)", async () => {
      const response = await POST(
        jsonRequest({ token: "short", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("returns 400 when password field is missing", async () => {
      const response = await POST(
        jsonRequest({ token: "valid-reset-token-123" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("returns 400 when body is invalid JSON", async () => {
      const response = await POST(
        new Request("http://localhost/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "not-json{"
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });
  });
});
