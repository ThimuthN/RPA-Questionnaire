import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const tx = {
  candidateMilestone: {
    findUnique: vi.fn(),
    delete: vi.fn()
  },
  candidateActivityEvent: {
    create: vi.fn()
  }
};

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(tx))
  }
}));

vi.mock("@/lib/db/candidates", () => ({
  initOrUpdateMilestoneCheck: vi.fn(),
  quickUpdateCandidateMilestoneStatus: vi.fn(),
  updateCandidateMilestone: vi.fn()
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "event-1"
}));

import { DELETE } from "./route";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

describe("DELETE /api/candidates/[id]/milestones/[milestoneId]", () => {
  const session = { userId: "user-1", name: "User", permissions: ["manage_candidates"] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not open a transaction when candidate permission fails", async () => {
    const forbidden = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: false, response: forbidden } as any);

    const response = await DELETE(new Request("http://localhost/api/candidates/cand-1/milestones/ms-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "cand-1", milestoneId: "ms-1" })
    });

    expect(response.status).toBe(403);
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
  });

  it("returns safe 404 and does not delete for a cross-candidate milestone", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true, candidate: { id: "cand-1" } } as any);
    tx.candidateMilestone.findUnique.mockResolvedValue({
      candidateId: "other-candidate",
      title: "Interview",
      mode: "manual",
      type: "interview"
    });

    const response = await DELETE(new Request("http://localhost/api/candidates/cand-1/milestones/ms-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "cand-1", milestoneId: "ms-1" })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Milestone not found." });
    expect(tx.candidateMilestone.delete).not.toHaveBeenCalled();
  });
});
