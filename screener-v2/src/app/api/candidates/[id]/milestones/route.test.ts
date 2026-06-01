import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidateMilestone: {
      findFirst: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "milestone-new"
}));

import { POST } from "./route";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

describe("POST /api/candidates/[id]/milestones", () => {
  const session = { userId: "user-1", name: "User", permissions: ["manage_candidates"] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an additional milestone with an explicit generated id", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true, candidate: { id: "cand-1" } } as any);
    vi.mocked(prisma.candidateMilestone.findFirst)
      .mockResolvedValueOnce({ sortOrder: 9999 } as any)
      .mockResolvedValueOnce({ sortOrder: 40 } as any);
    vi.mocked(prisma.candidateMilestone.create).mockResolvedValue({
      id: "milestone-new",
      candidateId: "cand-1",
      type: "advanced_review",
      title: "Additional test",
      status: "not_started",
      mode: "platform",
      sortOrder: 41
    } as any);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/milestones", {
        method: "POST",
        body: JSON.stringify({ type: "advanced_review" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(response.status).toBe(201);
    expect(prisma.candidateMilestone.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "milestone-new",
        candidateId: "cand-1",
        type: "advanced_review",
        title: "Additional test",
        status: "not_started",
        mode: "platform",
        sortOrder: 41
      })
    });
  });
});
