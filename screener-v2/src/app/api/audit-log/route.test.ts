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
    auditLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { isSystemAdmin, hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";

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

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id: "log-1",
    action: "user_created",
    actorId: "user-admin-1",
    actorEmail: "admin@example.com",
    targetId: "user-2",
    targetType: "user",
    after: null,
    ipAddress: "127.0.0.1",
    createdAt: new Date("2026-01-15T10:00:00.000Z"),
    ...overrides,
  };
}

describe("GET /api/audit-log - authentication & authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: false,
      response: UNAUTH_RESPONSE,
    } as never);

    const response = await GET(new Request("http://localhost/api/audit-log"));

    expect(response.status).toBe(401);
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not admin and lacks manage_users", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-basic", email: "basic@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
    expect(data.message).toBe("Forbidden.");
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("returns 403 when session has no userId", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: null, email: null, permissions: [] },
    } as never);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
  });

  it("allows system admin without manage_users permission", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "sysadmin-1", email: "sysadmin@example.com", permissions: [] },
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(hasGlobalPermission).mockResolvedValue(false);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});

describe("GET /api/audit-log - pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
  });

  it("returns paginated logs with default limit of 50", async () => {
    const logs = Array.from({ length: 3 }, (_, i) =>
      makeLog({ id: `log-${i + 1}`, action: `action_${i + 1}` })
    );
    vi.mocked(prisma.auditLog.count).mockResolvedValue(3);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(logs as never);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.logs).toHaveLength(3);
    expect(data.total).toBe(3);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(50);
    expect(data.pages).toBe(1);
  });

  it("uses page param to set correct skip offset", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(120);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/audit-log?page=3&limit=50"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 100, // (3 - 1) * 50
        take: 50,
      })
    );
  });

  it("respects custom limit param", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(200);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/audit-log?limit=25"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25 })
    );
  });

  it("caps limit at 100", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(500);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/audit-log?limit=999"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it("floors limit at 10", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(50);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/audit-log?limit=2"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it("clamps page to minimum of 1 for invalid page param", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(10);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/audit-log?page=-5"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });

  it("calculates pages correctly", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(105);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/audit-log?limit=50"));
    const data = await response.json();

    expect(data.pages).toBe(3); // ceil(105/50)
    expect(data.total).toBe(105);
    expect(data.limit).toBe(50);
  });

  it("returns page number in response", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(200);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/audit-log?page=4&limit=10"));
    const data = await response.json();

    expect(data.page).toBe(4);
  });
});

describe("GET /api/audit-log - filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
  });

  it("filters by action param", async () => {
    await GET(new Request("http://localhost/api/audit-log?action=user_created"));

    expect(prisma.auditLog.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ action: "user_created" }) })
    );
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ action: "user_created" }) })
    );
  });

  it("filters by actor email with case-insensitive contains", async () => {
    await GET(new Request("http://localhost/api/audit-log?actor=admin"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          actorEmail: { contains: "admin", mode: "insensitive" },
        }),
      })
    );
  });

  it("does not include actorEmail filter when actor param is empty string", async () => {
    await GET(new Request("http://localhost/api/audit-log?actor="));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("does not include actorEmail filter when actor param is whitespace only", async () => {
    await GET(new Request("http://localhost/api/audit-log?actor=   "));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("combines action and actor filters", async () => {
    await GET(new Request("http://localhost/api/audit-log?action=login&actor=jane"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          action: "login",
          actorEmail: { contains: "jane", mode: "insensitive" },
        },
      })
    );
  });

  it("empty filter (no params) passes empty where clause and returns all events", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(7);
    const logs = Array.from({ length: 7 }, (_, i) => makeLog({ id: `log-${i}` }));
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(logs as never);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
    expect(data.logs).toHaveLength(7);
  });
});

describe("GET /api/audit-log - response shape", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
  });

  it("serializes createdAt as ISO string", async () => {
    const ts = new Date("2026-03-10T08:30:00.000Z");
    vi.mocked(prisma.auditLog.count).mockResolvedValue(1);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([makeLog({ createdAt: ts })] as never);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    expect(data.logs[0].createdAt).toBe("2026-03-10T08:30:00.000Z");
  });

  it("returns correct select fields on each log entry", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(1);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      makeLog({ after: { mfaEnforcement: "all" } }),
    ] as never);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    const log = data.logs[0];
    expect(log).toHaveProperty("id");
    expect(log).toHaveProperty("action");
    expect(log).toHaveProperty("actorId");
    expect(log).toHaveProperty("actorEmail");
    expect(log).toHaveProperty("targetId");
    expect(log).toHaveProperty("targetType");
    expect(log).toHaveProperty("after");
    expect(log).toHaveProperty("ipAddress");
    expect(log).toHaveProperty("createdAt");
  });

  it("orders results by createdAt desc", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/audit-log"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });

  it("returns empty logs array when no records exist", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/audit-log"));
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.logs).toEqual([]);
    expect(data.total).toBe(0);
    expect(data.pages).toBe(0);
  });

  it("applies select projection in findMany call", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/audit-log"));

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          action: true,
          actorId: true,
          actorEmail: true,
          targetId: true,
          targetType: true,
          after: true,
          ipAddress: true,
          createdAt: true,
        },
      })
    );
  });
});
