import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/app-session", () => ({
  getAppSession: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    mfaTrustedDevice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn()
    }
  }
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn()
}));

import { GET, DELETE } from "./route";
import { getAppSession } from "@/lib/auth/app-session";
import { prisma } from "@/lib/db/prisma";
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

const MOCK_DEVICES = [
  {
    id: "device-1",
    deviceLabel: "Chrome on Windows",
    lastUsedAt: new Date("2026-06-01T10:00:00Z"),
    expiresAt: new Date("2026-07-01T10:00:00Z"),
    createdAt: new Date("2026-06-01T10:00:00Z")
  },
  {
    id: "device-2",
    deviceLabel: "Safari on macOS",
    lastUsedAt: new Date("2026-06-10T12:00:00Z"),
    expiresAt: new Date("2026-07-10T12:00:00Z"),
    createdAt: new Date("2026-06-10T12:00:00Z")
  }
];

describe("/api/auth/mfa/devices GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppSession).mockResolvedValue(MOCK_SESSION);
    vi.mocked(prisma.mfaTrustedDevice.findMany).mockResolvedValue(MOCK_DEVICES as never);
  });

  it("returns a list of active trusted devices for the authenticated user", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.devices).toHaveLength(2);
    expect(data.devices[0]).toMatchObject({
      id: "device-1",
      deviceLabel: "Chrome on Windows"
    });
  });

  it("queries only non-expired devices belonging to the current user", async () => {
    await GET();

    expect(vi.mocked(prisma.mfaTrustedDevice.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          expiresAt: expect.objectContaining({ gt: expect.any(Date) })
        })
      })
    );
  });

  it("returns an empty devices array when no trusted devices exist", async () => {
    vi.mocked(prisma.mfaTrustedDevice.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.devices).toEqual([]);
  });

  it("returns 401 when not authenticated", async () => {
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
});

describe("/api/auth/mfa/devices DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppSession).mockResolvedValue(MOCK_SESSION);
    vi.mocked(prisma.mfaTrustedDevice.findUnique).mockResolvedValue({
      userId: "user-1",
      deviceLabel: "Chrome on Windows"
    } as never);
    vi.mocked(prisma.mfaTrustedDevice.delete).mockResolvedValue({} as never);
    vi.mocked(logAudit).mockResolvedValue(undefined);
  });

  it("deletes the specified device and returns ok:true", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/auth/mfa/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "device-1" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(vi.mocked(prisma.mfaTrustedDevice.delete)).toHaveBeenCalledWith({
      where: { id: "device-1" }
    });
  });

  it("writes an mfa_device_revoked audit log entry after deletion", async () => {
    await DELETE(
      new Request("http://localhost/api/auth/mfa/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "device-1" })
      })
    );

    expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mfa_device_revoked",
        actorId: "user-1",
        actorEmail: "user@example.com",
        targetId: "device-1",
        targetType: "mfa_device",
        after: expect.objectContaining({ deviceLabel: "Chrome on Windows" })
      })
    );
  });

  it("returns 404 when device does not exist", async () => {
    vi.mocked(prisma.mfaTrustedDevice.findUnique).mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/auth/mfa/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "nonexistent-device" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(vi.mocked(prisma.mfaTrustedDevice.delete)).not.toHaveBeenCalled();
  });

  it("returns 404 (forbidden) when trying to revoke another user's device", async () => {
    vi.mocked(prisma.mfaTrustedDevice.findUnique).mockResolvedValue({
      userId: "other-user-99",
      deviceLabel: "Firefox on Linux"
    } as never);

    const response = await DELETE(
      new Request("http://localhost/api/auth/mfa/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "device-belonging-to-other" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(vi.mocked(prisma.mfaTrustedDevice.delete)).not.toHaveBeenCalled();
    expect(vi.mocked(logAudit)).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAppSession).mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/auth/mfa/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "device-1" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.ok).toBe(false);
  });

  it("throws (Zod parse error) when deviceId is missing from request body", async () => {
    await expect(
      DELETE(
        new Request("http://localhost/api/auth/mfa/devices", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        })
      )
    ).rejects.toThrow();
  });
});
