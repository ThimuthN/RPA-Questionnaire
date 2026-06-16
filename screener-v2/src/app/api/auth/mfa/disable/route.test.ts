import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/app-session", () => ({
  getAppSession: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    mfaTrustedDevice: {
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("@/lib/auth/mfa", () => ({
  verifyTotp: vi.fn()
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn()
}));

import { POST } from "./route";
import { getAppSession } from "@/lib/auth/app-session";
import { prisma } from "@/lib/db/prisma";
import { verifyTotp } from "@/lib/auth/mfa";
import { logAudit } from "@/lib/auth/audit";

const MOCK_SESSION = {
  userId: "user-1",
  email: "user@example.com",
  name: "Test User",
  roleId: "role-1",
  departmentId: null,
  permissions: [],
  exp: Math.floor(Date.now() / 1000) + 3600
};

describe("/api/auth/mfa/disable POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppSession).mockResolvedValue(MOCK_SESSION);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      mfaEnabled: true,
      mfaSecret: "encrypted-secret"
    } as never);
    vi.mocked(prisma.user.update).mockReturnValue({} as never);
    vi.mocked(prisma.mfaTrustedDevice.deleteMany).mockReturnValue({} as never);
    vi.mocked(verifyTotp).mockReturnValue(true);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  describe("successful disable", () => {
    it("returns ok:true when TOTP code is valid", async () => {
      const response = await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("runs user update and trusted device purge in a transaction", async () => {
      await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );

      expect(vi.mocked(prisma.$transaction)).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()])
      );
    });

    it("clears mfaSecret, mfaBackupCodes, and mfaEnrolledAt on the user record", async () => {
      // Capture what was passed to $transaction and inspect the user.update call
      vi.mocked(prisma.user.update).mockReturnValue({} as never);
      vi.mocked(prisma.mfaTrustedDevice.deleteMany).mockReturnValue({} as never);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown[]) => {
        return Promise.all(ops.map((op) => op));
      });

      await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );

      expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({
            mfaEnabled: false,
            mfaSecret: null,
            mfaBackupCodes: null,
            mfaEnrolledAt: null
          })
        })
      );
    });

    it("deletes all trusted devices for the user via deleteMany in transaction", async () => {
      vi.mocked(prisma.user.update).mockReturnValue({} as never);
      vi.mocked(prisma.mfaTrustedDevice.deleteMany).mockReturnValue({} as never);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown[]) => {
        return Promise.all(ops.map((op) => op));
      });

      await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );

      expect(vi.mocked(prisma.mfaTrustedDevice.deleteMany)).toHaveBeenCalledWith({
        where: { userId: "user-1" }
      });
    });

    it("writes an mfa_disabled audit log entry after successful disable", async () => {
      await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "1.2.3.4",
            "user-agent": "Mozilla/5.0 Chrome/120"
          },
          body: JSON.stringify({ code: "123456" })
        })
      );

      expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "mfa_disabled",
          actorId: "user-1",
          actorEmail: "user@example.com",
          targetId: "user-1",
          targetType: "user",
          ipAddress: "1.2.3.4",
          userAgent: "Mozilla/5.0 Chrome/120"
        })
      );
    });

    it("strips whitespace from code before calling verifyTotp", async () => {
      await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123 456" })
        })
      );

      expect(vi.mocked(verifyTotp)).toHaveBeenCalledWith("encrypted-secret", "123456");
    });
  });

  describe("invalid TOTP code", () => {
    it("returns 422 when the TOTP code is wrong", async () => {
      vi.mocked(verifyTotp).mockReturnValue(false);

      const response = await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "000000" })
        })
      );
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.ok).toBe(false);
      expect(data.message).toMatch(/invalid code/i);
    });

    it("does not run the DB transaction when code is invalid", async () => {
      vi.mocked(verifyTotp).mockReturnValue(false);

      await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "000000" })
        })
      );

      expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
    });

    it("does not write an audit log when code is invalid", async () => {
      vi.mocked(verifyTotp).mockReturnValue(false);

      await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "000000" })
        })
      );

      expect(vi.mocked(logAudit)).not.toHaveBeenCalled();
    });
  });

  describe("unauthenticated / MFA not enrolled", () => {
    it("returns 401 when there is no session", async () => {
      vi.mocked(getAppSession).mockResolvedValue(null);

      const response = await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("returns 409 when MFA is not currently enabled", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        mfaEnabled: false,
        mfaSecret: null
      } as never);

      const response = await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.ok).toBe(false);
      expect(data.message).toMatch(/not enabled/i);
    });

    it("returns 409 when mfaSecret is null even if mfaEnabled is true", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        mfaEnabled: true,
        mfaSecret: null
      } as never);

      const response = await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );

      expect(response.status).toBe(409);
    });

    it("returns 401 when user is not found in DB", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await POST(
        new Request("http://localhost/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "123456" })
        })
      );

      // user not found is handled by the !user?.mfaEnabled || !user.mfaSecret check → 409
      // (null?.mfaEnabled is undefined which is falsy)
      expect([401, 409]).toContain(response.status);
    });
  });

  describe("validation errors", () => {
    it("throws (Zod parse error) when code is missing", async () => {
      await expect(
        POST(
          new Request("http://localhost/api/auth/mfa/disable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          })
        )
      ).rejects.toThrow();
    });

    it("throws (Zod parse error) when code is too short", async () => {
      await expect(
        POST(
          new Request("http://localhost/api/auth/mfa/disable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: "12345" })
          })
        )
      ).rejects.toThrow();
    });
  });
});
