import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/app-session", () => ({
  getAppSession: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("@/lib/auth/mfa", () => ({
  generateMfaSetup: vi.fn(),
  encryptMfaSecret: vi.fn(),
  generateBackupCodes: vi.fn(),
  serializeBackupCodes: vi.fn()
}));

vi.mock("@/lib/brand/theme", () => ({
  brandOrgName: vi.fn()
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn()
}));

vi.mock("otplib", () => ({
  verifySync: vi.fn()
}));

import { GET, POST } from "./route";
import { getAppSession } from "@/lib/auth/app-session";
import { prisma } from "@/lib/db/prisma";
import {
  generateMfaSetup,
  encryptMfaSecret,
  generateBackupCodes,
  serializeBackupCodes
} from "@/lib/auth/mfa";
import { brandOrgName } from "@/lib/brand/theme";
import { logAudit } from "@/lib/auth/audit";
import { verifySync } from "otplib";

const MOCK_SESSION = {
  userId: "user-1",
  email: "user@example.com",
  name: "Test User",
  roleId: "role-1",
  departmentId: null,
  permissions: [],
  exp: Math.floor(Date.now() / 1000) + 3600
};

describe("/api/auth/mfa/setup GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppSession).mockResolvedValue(MOCK_SESSION);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      mfaEnabled: false,
      email: "user@example.com"
    } as never);
    vi.mocked(brandOrgName).mockReturnValue("Test Org");
    vi.mocked(generateMfaSetup).mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      qrCodeDataUrl: "data:image/png;base64,abc123",
      otpAuthUrl: "otpauth://totp/Test%20Org:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test%20Org"
    });
  });

  it("returns secret, qrCodeDataUrl, and otpAuthUrl for an authenticated user without MFA", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(data.qrCodeDataUrl).toBe("data:image/png;base64,abc123");
    expect(data.otpAuthUrl).toContain("otpauth://totp/");
  });

  it("calls generateMfaSetup with org name from brandOrgName", async () => {
    await GET();

    expect(vi.mocked(generateMfaSetup)).toHaveBeenCalledWith("user@example.com", "Test Org");
  });

  it("falls back to 'Northstar Hiring' when brandOrgName returns null", async () => {
    vi.mocked(brandOrgName).mockReturnValue(null);

    await GET();

    expect(vi.mocked(generateMfaSetup)).toHaveBeenCalledWith("user@example.com", "Northstar Hiring");
  });

  it("returns 401 when not authenticated (no session)", async () => {
    vi.mocked(getAppSession).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.ok).toBe(false);
  });

  it("returns 401 when session has no userId", async () => {
    vi.mocked(getAppSession).mockResolvedValue({ ...MOCK_SESSION, userId: null } as never);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 401 when user is not found in DB", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 409 when MFA is already enabled", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      mfaEnabled: true,
      email: "user@example.com"
    } as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.message).toMatch(/already enabled/i);
  });
});

describe("/api/auth/mfa/setup POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppSession).mockResolvedValue(MOCK_SESSION);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      mfaEnabled: false,
      email: "user@example.com"
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(verifySync).mockReturnValue({ valid: true } as never);
    vi.mocked(encryptMfaSecret).mockReturnValue("encrypted-secret");
    vi.mocked(generateBackupCodes).mockReturnValue({
      plain: ["AAAA-BBBB", "CCCC-DDDD"],
      hashed: ["hash1", "hash2"]
    });
    vi.mocked(serializeBackupCodes).mockReturnValue('["hash1","hash2"]');
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  it("enables MFA when TOTP code is valid and returns backup codes", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "123456" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.backupCodes).toEqual(["AAAA-BBBB", "CCCC-DDDD"]);
  });

  it("persists encrypted secret, hashed backup codes, and mfaEnrolledAt via prisma.user.update", async () => {
    await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "123456" })
      })
    );

    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          mfaEnabled: true,
          mfaSecret: "encrypted-secret",
          mfaBackupCodes: '["hash1","hash2"]',
          mfaEnrolledAt: expect.any(Date)
        })
      })
    );
  });

  it("writes an mfa_enabled audit log entry after successful enrollment", async () => {
    await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "123456" })
      })
    );

    expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mfa_enabled",
        actorId: "user-1",
        actorEmail: "user@example.com",
        targetId: "user-1",
        targetType: "user"
      })
    );
  });

  it("returns 422 when the TOTP code is invalid", async () => {
    vi.mocked(verifySync).mockReturnValue({ valid: false } as never);

    const response = await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "000000" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.ok).toBe(false);
    expect(data.message).toMatch(/invalid code/i);
    expect(vi.mocked(prisma.user.update)).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAppSession).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "123456" })
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 409 when MFA is already enrolled", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      mfaEnabled: true,
      email: "user@example.com"
    } as never);

    const response = await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "123456" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.message).toMatch(/already enabled/i);
  });

  it("returns 401 when user record is missing from DB", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "123456" })
      })
    );

    expect(response.status).toBe(401);
  });

  it("throws (Zod parse error) when secret is too short", async () => {
    await expect(
      POST(
        new Request("http://localhost/api/auth/mfa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: "short", code: "123456" })
        })
      )
    ).rejects.toThrow();
  });

  it("throws (Zod parse error) when code is not exactly 6 characters", async () => {
    await expect(
      POST(
        new Request("http://localhost/api/auth/mfa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "12345" })
        })
      )
    ).rejects.toThrow();
  });

  it("strips whitespace from code before verification", async () => {
    await POST(
      new Request("http://localhost/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "JBSWY3DPEHPK3PXP", code: "123456" })
      })
    );

    expect(vi.mocked(verifySync)).toHaveBeenCalledWith(
      expect.objectContaining({ token: "123456" })
    );
  });
});
