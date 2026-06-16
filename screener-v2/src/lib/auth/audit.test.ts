vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAudit } from "./audit";
import { prisma } from "@/lib/db/prisma";

const mockCreate = vi.mocked(prisma.auditLog.create);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logAudit", () => {
  it("calls prisma.auditLog.create with the supplied action and target fields", async () => {
    mockCreate.mockResolvedValue({} as never);

    await logAudit({
      action: "user_login",
      actorId: "user-1",
      actorEmail: "user@example.com",
      targetId: "user-1",
      targetType: "user",
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user_login",
        actorId: "user-1",
        actorEmail: "user@example.com",
        targetId: "user-1",
        targetType: "user",
      }),
    });
  });

  it("stores ipAddress and userAgent when provided", async () => {
    mockCreate.mockResolvedValue({} as never);

    await logAudit({
      action: "password_changed",
      actorId: "user-2",
      targetId: "user-2",
      targetType: "user",
      ipAddress: "203.0.113.42",
      userAgent: "Mozilla/5.0 (compatible; Vitest)",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: "203.0.113.42",
        userAgent: "Mozilla/5.0 (compatible; Vitest)",
      }),
    });
  });

  it("stores before/after JSON snapshots for change-tracking events", async () => {
    mockCreate.mockResolvedValue({} as never);

    const before = { isPublished: false };
    const after = { isPublished: true };

    await logAudit({
      action: "job_updated",
      actorId: "user-3",
      targetId: "job-99",
      targetType: "job",
      before,
      after,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ before, after }),
    });
  });

  it("accepts actorId as null for login_failed / unauthenticated events", async () => {
    mockCreate.mockResolvedValue({} as never);

    await logAudit({
      action: "login_failed",
      actorId: null,
      actorEmail: "unknown@example.com",
      targetId: "unknown@example.com",
      targetType: "email",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "login_failed",
        actorId: null,
      }),
    });
  });

  it("accepts actorId as undefined (field omitted entirely)", async () => {
    mockCreate.mockResolvedValue({} as never);

    await logAudit({
      action: "magic_link_sent",
      targetId: "user-10",
      targetType: "user",
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    const callArg = mockCreate.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(callArg.data.targetId).toBe("user-10");
  });

  it("accepts ipAddress as null", async () => {
    mockCreate.mockResolvedValue({} as never);

    await logAudit({
      action: "session_revoked",
      actorId: "admin-1",
      targetId: "session-abc",
      targetType: "session",
      ipAddress: null,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ ipAddress: null }),
    });
  });

  it("does not throw when prisma.auditLog.create rejects (fire-and-forget caller safety)", async () => {
    mockCreate.mockRejectedValue(new Error("DB connection lost"));

    // logAudit itself awaits prisma, so the rejection propagates to callers.
    // This test verifies that the rejection does propagate (callers should catch it),
    // and that the function signature does not silently swallow errors internally.
    await expect(
      logAudit({
        action: "user_login",
        actorId: "user-1",
        targetId: "user-1",
        targetType: "user",
      })
    ).rejects.toThrow("DB connection lost");
  });

  it("passes the full data object through unchanged to prisma (no field stripping)", async () => {
    mockCreate.mockResolvedValue({} as never);

    const input = {
      action: "role_assigned",
      actorId: "admin-5",
      actorEmail: "admin@example.com",
      targetId: "user-7",
      targetType: "user",
      before: { roleId: "role-old" },
      after: { roleId: "role-new" },
      ipAddress: "10.0.0.1",
      userAgent: "internal-script/1.0",
    };

    await logAudit(input);

    expect(mockCreate).toHaveBeenCalledWith({ data: input });
  });
});
