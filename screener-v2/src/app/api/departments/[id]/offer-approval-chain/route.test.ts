import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

// --- mocks ---
vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn(),
}));

vi.mock("@/lib/server/logger", () => ({
  createRequestLogContext: vi.fn(() => ({})),
  logRouteError: vi.fn(),
  messageFromError: vi.fn((err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback
  ),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    offerApprovalChain: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    offerApprovalChainStep: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

const mockSession = {
  ok: true as const,
  session: { userId: "user-1", email: "admin@co.com", name: "Admin", roleId: "role-1", departmentId: null, permissions: [], exp: 9999999999 },
};

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/departments/dept-1/offer-approval-chain", {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const params = Promise.resolve({ id: "dept-1" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireApiSession).mockResolvedValue(mockSession);
  vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
});

describe("GET /api/departments/[id]/offer-approval-chain", () => {
  it("returns null chain when none configured", async () => {
    vi.mocked(prisma.offerApprovalChain.findFirst).mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.chain).toBeNull();
  });

  it("returns chain with steps when configured", async () => {
    const chain = {
      id: "chain-1",
      name: "Default",
      departmentId: "dept-1",
      steps: [
        { id: "step-1", sortOrder: 0, approver: { id: "u1", name: "Alice", email: "alice@co.com" } },
      ],
    };
    vi.mocked(prisma.offerApprovalChain.findFirst).mockResolvedValue(chain as never);
    const res = await GET(makeRequest(), { params });
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.chain.steps).toHaveLength(1);
    expect(json.chain.steps[0].approver.name).toBe("Alice");
  });

  it("returns 403 when permission denied", async () => {
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false, message: "Forbidden" }), { status: 403 }),
    } as never);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/departments/[id]/offer-approval-chain", () => {
  beforeEach(() => {
    vi.mocked(prisma.department.findUnique).mockResolvedValue({ id: "dept-1" } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1" },
      { id: "u2" },
    ] as never);
  });

  it("creates chain with ordered steps", async () => {
    const resultChain = {
      id: "chain-1",
      steps: [
        { id: "s1", sortOrder: 0, approver: { id: "u1", name: "Alice", email: "a@co.com" } },
        { id: "s2", sortOrder: 1, approver: { id: "u2", name: "Bob", email: "b@co.com" } },
      ],
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      vi.mocked(prisma.offerApprovalChain.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.offerApprovalChain.create).mockResolvedValueOnce({ id: "chain-1" } as never);
      vi.mocked(prisma.offerApprovalChain.findFirst).mockResolvedValueOnce(resultChain as never);
      return fn(prisma);
    });

    const res = await POST(
      makeRequest({ steps: [{ approverId: "u1", sortOrder: 0 }, { approverId: "u2", sortOrder: 1 }] }),
      { params }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
  });

  it("accepts empty steps (clears chain)", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);
    const resultChain = { id: "chain-1", steps: [] };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      vi.mocked(prisma.offerApprovalChain.findFirst).mockResolvedValueOnce({ id: "chain-1" } as never);
      vi.mocked(prisma.offerApprovalChain.findFirst).mockResolvedValueOnce(resultChain as never);
      return fn(prisma);
    });

    const res = await POST(makeRequest({ steps: [] }), { params });
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("rejects invalid body", async () => {
    const res = await POST(makeRequest({ steps: "not-an-array" }), { params });
    expect(res.status).toBe(400);
  });

  it("rejects when approver ID not found", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: "u1" }] as never);
    const res = await POST(
      makeRequest({ steps: [{ approverId: "u1", sortOrder: 0 }, { approverId: "ghost", sortOrder: 1 }] }),
      { params }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toMatch(/not found/i);
  });
});
