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

describe("POST /api/candidates/[id]/revert-finalization", () => {
  const mockSession = { userId: "user-1", name: "Test User", permissions: ["hire_candidate", "manage_candidates"] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses hire_candidate permission for hired candidates", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ id: "cand-1", departmentId: "dept-1", orgStage: "finalized", finalizedAs: "hired" } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);

    await POST(new Request("http://localhost/api/candidates/cand-1/revert-finalization", { method: "POST" }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(mockSession, "hire_candidate", "dept-1");
  });

  it("uses manage_candidates permission for rejected candidates", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ id: "cand-1", departmentId: "dept-1", orgStage: "finalized", finalizedAs: "rejected" } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);

    await POST(new Request("http://localhost/api/candidates/cand-1/revert-finalization", { method: "POST" }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(mockSession, "manage_candidates", "dept-1");
  });

  it("returns 400 when candidate is not finalized", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ id: "cand-1", departmentId: "dept-1", orgStage: "active", finalizedAs: null } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/revert-finalization", { method: "POST" }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toContain("not finalized");
  });

  it("returns 403 for permission failure before non-finalized state check", async () => {
    const forbiddenResponse = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ id: "cand-1", departmentId: "dept-1", orgStage: "active", finalizedAs: null } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: false, response: forbiddenResponse } as any);

    const response = await POST(new Request("http://localhost/api/candidates/cand-1/revert-finalization", { method: "POST" }), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(403);
  });
});
