import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    candidateMilestone: {
      updateMany: vi.fn()
    },
    candidateActivityEvent: {
      create: vi.fn()
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        candidate: { update: vi.fn((...args: unknown[]) => vi.mocked(prisma.candidate.update)(...(args as Parameters<typeof prisma.candidate.update>))) },
        candidateMilestone: { updateMany: vi.fn().mockResolvedValue(undefined) },
        candidateActivityEvent: { create: vi.fn().mockResolvedValue(undefined) },
      })
    ),
  }
}));


vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "event-123"
}));

vi.mock("@/lib/server/logger", () => ({
  createRequestLogContext: () => ({}),
  logRouteError: vi.fn()
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

describe("POST /api/candidates/[id]/hire", () => {
  const mockSession = { userId: "user-1", name: "Test User", permissions: ["hire_candidate"] };
  const mockCandidate = { id: "cand-1", fullName: "John Doe", email: "john@example.com", phone: "555-0001", roleId: "role-1", departmentId: "dept-1", orgStage: "active" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hires candidate with hire_candidate permission", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidate.update).mockResolvedValue({ ...mockCandidate, orgStage: "finalized" } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/hire", { method: "POST", body: JSON.stringify({}) }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(200);
    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(mockSession, "hire_candidate", "dept-1");
  });


  it("returns 400 when candidate already finalized", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ ...mockCandidate, orgStage: "finalized" } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/hire", { method: "POST", body: JSON.stringify({}) }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toContain("already finalized");
  });

  it("returns 403 for permission failure before finalized state check", async () => {
    const forbiddenResponse = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ ...mockCandidate, orgStage: "finalized" } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: false, response: forbiddenResponse } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/hire", { method: "POST", body: JSON.stringify({}) }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(403);
    expect(vi.mocked(prisma.candidate.update)).not.toHaveBeenCalled();
  });

  it("returns 404 when candidate not found", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/hire", { method: "POST", body: JSON.stringify({}) }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 when permission check fails", async () => {
    const forbiddenResponse = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: false, response: forbiddenResponse } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/hire", { method: "POST", body: JSON.stringify({}) }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(403);
    expect(vi.mocked(prisma.candidate.update)).not.toHaveBeenCalled();
  });
});
