import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  isSystemAdmin: vi.fn(),
  hasGlobalPermission: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    orgSecuritySettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/security-settings", () => ({
  invalidateSecuritySettingsCache: vi.fn(),
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn(),
}));

import { GET, PATCH } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { isSystemAdmin, hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";
import { invalidateSecuritySettingsCache } from "@/lib/auth/security-settings";
import { logAudit } from "@/lib/auth/audit";

const ADMIN_SESSION = {
  ok: true,
  session: {
    userId: "user-admin-1",
    email: "admin@example.com",
    name: "Admin User",
    permissions: ["manage_users"],
  },
} as const;

const UNAUTH_RESPONSE = new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
  status: 401,
});

const DB_SETTINGS = {
  id: "singleton",
  mfaEnforcement: "admins",
  passwordMinLength: 10,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
  sessionDays: 14,
  lockoutThreshold: 5,
  lockoutMinutes: 15,
};

const DEFAULT_SETTINGS = {
  mfaEnforcement: "off",
  passwordMinLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: false,
  sessionDays: 7,
  lockoutThreshold: 10,
  lockoutMinutes: 30,
};

describe("GET /api/security-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(prisma.orgSecuritySettings.findUnique).mockResolvedValue(DB_SETTINGS as never);
  });

  it("returns settings from DB when user is system admin", async () => {
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);

    const response = await GET(new Request("http://localhost/api/security-settings"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.settings).toEqual(DB_SETTINGS);
  });

  it("returns settings when user has global manage_users permission", async () => {
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);

    const response = await GET(new Request("http://localhost/api/security-settings"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.settings).toEqual(DB_SETTINGS);
  });

  it("returns default settings when no DB row exists (findUnique returns null)", async () => {
    vi.mocked(prisma.orgSecuritySettings.findUnique).mockResolvedValue(null as never);

    const response = await GET(new Request("http://localhost/api/security-settings"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("returns default settings when findUnique throws (catch fallback to null)", async () => {
    vi.mocked(prisma.orgSecuritySettings.findUnique).mockRejectedValue(new Error("DB error") as never);

    const response = await GET(new Request("http://localhost/api/security-settings"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: false,
      response: UNAUTH_RESPONSE,
    } as never);

    const response = await GET(new Request("http://localhost/api/security-settings"));

    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not system admin and lacks manage_users", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-basic", email: "basic@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);

    const response = await GET(new Request("http://localhost/api/security-settings"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Forbidden.");
  });

  it("returns 403 when session has no userId", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: null, email: null, permissions: [] },
    } as never);

    const response = await GET(new Request("http://localhost/api/security-settings"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
  });
});

describe("PATCH /api/security-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(logAudit).mockResolvedValue(undefined as never);
    vi.mocked(prisma.orgSecuritySettings.upsert).mockResolvedValue({
      id: "singleton",
      mfaEnforcement: "all",
      passwordMinLength: 8,
      requireUppercase: true,
      requireNumber: true,
      requireSpecial: false,
      sessionDays: 7,
      lockoutThreshold: 10,
      lockoutMinutes: 30,
    } as never);
  });

  it("updates mfaEnforcement to 'all', invalidates cache, and fires audit log", async () => {
    const updatedRow = { id: "singleton", mfaEnforcement: "all", passwordMinLength: 8 };
    vi.mocked(prisma.orgSecuritySettings.upsert).mockResolvedValue(updatedRow as never);

    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaEnforcement: "all" }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.settings).toEqual(updatedRow);
    expect(invalidateSecuritySettingsCache).toHaveBeenCalledTimes(1);
    // logAudit is fire-and-forget but still called
    await vi.waitFor(() => {
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "security_settings_updated",
          actorId: "user-admin-1",
          actorEmail: "admin@example.com",
          targetId: "singleton",
          targetType: "org_security_settings",
          after: { mfaEnforcement: "all" },
        })
      );
    });
  });

  it("upserts with correct where/create/update shape", async () => {
    await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaEnforcement: "admins" }),
      })
    );

    expect(prisma.orgSecuritySettings.upsert).toHaveBeenCalledWith({
      where: { id: "singleton" },
      create: expect.objectContaining({ id: "singleton", mfaEnforcement: "admins", updatedById: "user-admin-1" }),
      update: expect.objectContaining({ mfaEnforcement: "admins", updatedById: "user-admin-1" }),
    });
  });

  it("updates passwordMinLength and requireUppercase", async () => {
    const updatedRow = { id: "singleton", passwordMinLength: 12, requireUppercase: false };
    vi.mocked(prisma.orgSecuritySettings.upsert).mockResolvedValue(updatedRow as never);

    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordMinLength: 12, requireUppercase: false }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.settings).toEqual(updatedRow);
  });

  it("updates lockoutThreshold and lockoutMinutes", async () => {
    const updatedRow = { id: "singleton", lockoutThreshold: 5, lockoutMinutes: 60 };
    vi.mocked(prisma.orgSecuritySettings.upsert).mockResolvedValue(updatedRow as never);

    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockoutThreshold: 5, lockoutMinutes: 60 }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("passes IP and user-agent from headers to logAudit", async () => {
    await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.0.1",
          "user-agent": "Mozilla/5.0",
        },
        body: JSON.stringify({ mfaEnforcement: "off" }),
      })
    );

    await vi.waitFor(() => {
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: "10.0.0.1",
          userAgent: "Mozilla/5.0",
        })
      );
    });
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": "192.168.1.5",
        },
        body: JSON.stringify({ sessionDays: 30 }),
      })
    );

    await vi.waitFor(() => {
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: "192.168.1.5" })
      );
    });
  });

  it("throws ZodError when mfaEnforcement is an invalid enum value", async () => {
    // The PATCH handler calls updateSchema.parse() without a surrounding try/catch,
    // so invalid input throws a ZodError rather than returning a 400 response.
    await expect(
      PATCH(
        new Request("http://localhost/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mfaEnforcement: "everyone" }),
        })
      )
    ).rejects.toThrow();
  });

  it("throws ZodError when passwordMinLength is below 6", async () => {
    await expect(
      PATCH(
        new Request("http://localhost/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passwordMinLength: 5 }),
        })
      )
    ).rejects.toThrow();
  });

  it("throws ZodError when passwordMinLength exceeds 64", async () => {
    await expect(
      PATCH(
        new Request("http://localhost/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passwordMinLength: 65 }),
        })
      )
    ).rejects.toThrow();
  });

  it("throws ZodError when lockoutThreshold is below 3", async () => {
    await expect(
      PATCH(
        new Request("http://localhost/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockoutThreshold: 2 }),
        })
      )
    ).rejects.toThrow();
  });

  it("throws ZodError when lockoutMinutes is below 5", async () => {
    await expect(
      PATCH(
        new Request("http://localhost/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockoutMinutes: 4 }),
        })
      )
    ).rejects.toThrow();
  });

  it("throws ZodError when sessionDays exceeds 90", async () => {
    await expect(
      PATCH(
        new Request("http://localhost/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionDays: 91 }),
        })
      )
    ).rejects.toThrow();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: false,
      response: UNAUTH_RESPONSE,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaEnforcement: "all" }),
      })
    );

    expect(response.status).toBe(401);
    expect(prisma.orgSecuritySettings.upsert).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin user", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-basic", email: "basic@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);

    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaEnforcement: "all" }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Forbidden.");
    expect(prisma.orgSecuritySettings.upsert).not.toHaveBeenCalled();
  });

  it("returns updated settings in response body", async () => {
    const savedSettings = {
      id: "singleton",
      mfaEnforcement: "all",
      passwordMinLength: 12,
      requireUppercase: true,
      requireNumber: false,
      requireSpecial: true,
      sessionDays: 30,
      lockoutThreshold: 5,
      lockoutMinutes: 60,
    };
    vi.mocked(prisma.orgSecuritySettings.upsert).mockResolvedValue(savedSettings as never);

    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mfaEnforcement: "all",
          passwordMinLength: 12,
          requireSpecial: true,
          sessionDays: 30,
          lockoutThreshold: 5,
          lockoutMinutes: 60,
        }),
      })
    );
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.settings).toEqual(savedSettings);
  });

  it("accepts all fields at boundary values (min)", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordMinLength: 6,
          sessionDays: 1,
          lockoutThreshold: 3,
          lockoutMinutes: 5,
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(prisma.orgSecuritySettings.upsert).toHaveBeenCalled();
  });

  it("accepts all fields at boundary values (max)", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/security-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordMinLength: 64,
          sessionDays: 90,
          lockoutThreshold: 100,
          lockoutMinutes: 1440,
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(prisma.orgSecuritySettings.upsert).toHaveBeenCalled();
  });

  it("does not call upsert or invalidate cache on validation failure", async () => {
    await expect(
      PATCH(
        new Request("http://localhost/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mfaEnforcement: "invalid" }),
        })
      )
    ).rejects.toThrow();

    expect(prisma.orgSecuritySettings.upsert).not.toHaveBeenCalled();
    expect(invalidateSecuritySettingsCache).not.toHaveBeenCalled();
  });
});
