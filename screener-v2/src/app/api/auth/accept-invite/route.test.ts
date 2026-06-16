import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn()
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

vi.mock("@/lib/auth/session", () => ({
  createSessionToken: vi.fn(),
  setSessionCookie: vi.fn()
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  getEffectivePermissions: vi.fn()
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn()
}));

import { POST } from "./route";
import { consumeUserAuthToken } from "@/lib/auth/user-tokens";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { getOrgSecuritySettings, extractPasswordPolicy } from "@/lib/auth/security-settings";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { getEffectivePermissions } from "@/lib/auth/permission-evaluator";
import { logAudit } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/accept-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

const ACTIVE_USER = {
  id: "user-1",
  email: "bob@example.com",
  name: "Bob",
  roleId: "role-1",
  departmentId: "dept-1",
  isActive: true,
  sessionVersion: 1
};

const DEFAULT_SECURITY_SETTINGS = { minLength: 8, requireUppercase: false };
const DEFAULT_PASSWORD_POLICY = { minLength: 8 };

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("POST /api/auth/accept-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getOrgSecuritySettings).mockResolvedValue(DEFAULT_SECURITY_SETTINGS as never);
    vi.mocked(extractPasswordPolicy).mockReturnValue(DEFAULT_PASSWORD_POLICY as never);
    vi.mocked(consumeUserAuthToken).mockResolvedValue({ ok: true, userId: "user-1" } as never);
    vi.mocked(validatePasswordStrength).mockReturnValue({ ok: true } as never);
    vi.mocked(hashPassword).mockReturnValue("hashed-pw");
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(ACTIVE_USER as never);
    vi.mocked(getEffectivePermissions).mockResolvedValue(["view_candidates"] as never);
    vi.mocked(createSessionToken).mockResolvedValue("session-token-xyz");
    vi.mocked(setSessionCookie).mockReturnValue(undefined);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe("valid invite + strong password", () => {
    it("returns 200 with ok:true and next:/", async () => {
      const response = await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.next).toBe("/");
    });

    it("calls setSessionCookie with the new session token", async () => {
      await POST(jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" }));

      expect(setSessionCookie).toHaveBeenCalledWith(expect.anything(), "session-token-xyz");
    });

    it("activates the user account (isActive: true) and sets passwordHash", async () => {
      await POST(jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" }));

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({
            passwordHash: "hashed-pw",
            isActive: true
          })
        })
      );
    });

    it("calls logAudit with user_invite_accepted", async () => {
      await POST(jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" }));

      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "user_invite_accepted",
          actorId: "user-1",
          actorEmail: "bob@example.com",
          targetType: "user"
        })
      );
    });

    it("calls createSessionToken with the resolved user fields and permissions", async () => {
      vi.mocked(getEffectivePermissions).mockResolvedValue(["manage_users", "view_candidates"] as never);

      await POST(jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" }));

      expect(createSessionToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          email: "bob@example.com",
          permissions: ["manage_users", "view_candidates"]
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Optional name field
  // -------------------------------------------------------------------------

  describe("optional name field", () => {
    it("accepts the invite without a name field", async () => {
      const response = await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("trims and applies name when provided", async () => {
      await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!", name: "  Bob Smith  " })
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Bob Smith" })
        })
      );
    });

    it("does NOT include name in the update when it is an empty string", async () => {
      await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!", name: "   " })
      );

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0]?.[0];
      expect(updateCall?.data).not.toHaveProperty("name");
    });
  });

  // -------------------------------------------------------------------------
  // Invalid token
  // -------------------------------------------------------------------------

  describe("invalid or expired invite token", () => {
    it("returns 400 with the reason from consumeUserAuthToken", async () => {
      vi.mocked(consumeUserAuthToken).mockResolvedValue({
        ok: false,
        reason: "Invite link has expired."
      } as never);

      const response = await POST(
        jsonRequest({ token: "expired-invite-token-123", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.message).toBe("Invite link has expired.");
    });

    it("does NOT call prisma.user.update when token is invalid", async () => {
      vi.mocked(consumeUserAuthToken).mockResolvedValue({
        ok: false,
        reason: "Invalid token."
      } as never);

      await POST(jsonRequest({ token: "bad-token-xyz", password: "StrongPass1!" }));
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("does NOT set a session cookie when token is invalid", async () => {
      vi.mocked(consumeUserAuthToken).mockResolvedValue({
        ok: false,
        reason: "Already used."
      } as never);

      await POST(jsonRequest({ token: "used-token-xyz", password: "StrongPass1!" }));
      expect(setSessionCookie).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Weak password
  // -------------------------------------------------------------------------

  describe("password strength validation", () => {
    it("returns 400 with the strength failure message when password is too weak", async () => {
      vi.mocked(validatePasswordStrength).mockReturnValue({
        ok: false,
        message: "Password must contain at least one uppercase letter."
      } as never);

      const response = await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "weakpass" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.message).toContain("uppercase");
    });

    it("does NOT call prisma.user.update when password fails strength check", async () => {
      vi.mocked(validatePasswordStrength).mockReturnValue({
        ok: false,
        message: "Too short."
      } as never);

      await POST(jsonRequest({ token: "valid-invite-token-123", password: "x" }));
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Inactive user after update (safety guard)
  // -------------------------------------------------------------------------

  describe("inactive user after update", () => {
    it("returns 400 when the re-fetched user is inactive", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...ACTIVE_USER,
        isActive: false
      } as never);

      const response = await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.message).toContain("not available");
    });

    it("returns 400 when the re-fetched user is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.message).toContain("not available");
    });

    it("does NOT set a session cookie for inactive users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...ACTIVE_USER,
        isActive: false
      } as never);

      await POST(jsonRequest({ token: "valid-invite-token-123", password: "StrongPass1!" }));
      expect(setSessionCookie).not.toHaveBeenCalled();
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

    it("returns 400 when password field is empty", async () => {
      const response = await POST(
        jsonRequest({ token: "valid-invite-token-123", password: "" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("returns 400 when body is invalid JSON", async () => {
      const response = await POST(
        new Request("http://localhost/api/auth/accept-invite", {
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
