import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn((cb: any) => cb({
      candidate: { update: vi.fn() },
      departmentCandidacy: { updateMany: vi.fn() },
      candidateActivityEvent: { create: vi.fn() }
    }))
  }
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "event-123"
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

describe("POST /api/candidates/[id]/reject", () => {
  const mockSession = { userId: "user-1", name: "Test User", permissions: ["manage_candidates"] };
  const mockCandidate = { id: "cand-1", departmentId: "dept-1", orgStage: "active" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects candidate when not already finalized", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/reject", { method: "POST", body: JSON.stringify({}) }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(200);
  });

  it("returns 400 when candidate already finalized", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ ...mockCandidate, orgStage: "finalized" } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/reject", { method: "POST", body: JSON.stringify({}) }), {
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

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/reject", { method: "POST", body: JSON.stringify({}) }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(403);
  });
});
