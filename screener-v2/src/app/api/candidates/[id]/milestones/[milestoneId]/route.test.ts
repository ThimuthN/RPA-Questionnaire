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
  updateCandidateMilestone: vi.fn(),
  upsertInterviewPanelForMilestone: vi.fn()
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "event-1"
}));

import { DELETE } from "./route";
import { POST } from "./route";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { updateCandidateMilestone, upsertInterviewPanelForMilestone } from "@/lib/db/candidates";

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

  it("redirects milestone saves back to the provided returnTo path", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true, candidate: { id: "cand-1" } } as any);
    vi.mocked(updateCandidateMilestone).mockResolvedValue(undefined as never);

    const formData = new FormData();
    formData.append("action", "save");
    formData.append("title", "Assessment");
    formData.append("status", "done");
    formData.append("mode", "manual");
    formData.append("returnTo", "/people/candidates/cand-1?workspaceId=dept-1");

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/milestones/ms-1", {
        method: "POST",
        body: formData
      }),
      {
        params: Promise.resolve({ id: "cand-1", milestoneId: "ms-1" })
      }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/people/candidates/cand-1?workspaceId=dept-1&updated=1"
    );
  });

  it("upserts interview panel data when interview scheduling fields are submitted", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true, candidate: { id: "cand-1" } } as any);
    vi.mocked(updateCandidateMilestone).mockResolvedValue(undefined as never);
    vi.mocked(upsertInterviewPanelForMilestone).mockResolvedValue(undefined as never);

    const formData = new FormData();
    formData.append("action", "save");
    formData.append("title", "Interview");
    formData.append("status", "in_progress");
    formData.append("mode", "manual");
    formData.append("interviewScheduledAt", "2026-06-20T09:00");
    formData.append("interviewDurationMin", "45");
    formData.append("interviewFormat", "video");
    formData.append("interviewerIdsJson", JSON.stringify(["user-1", "user-2"]));

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/milestones/ms-2", {
        method: "POST",
        body: formData
      }),
      {
        params: Promise.resolve({ id: "cand-1", milestoneId: "ms-2" })
      }
    );

    expect(response.status).toBe(303);
    expect(vi.mocked(upsertInterviewPanelForMilestone)).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: "cand-1",
        milestoneId: "ms-2",
        scheduledAt: "2026-06-20T09:00",
        durationMin: 45,
        format: "video",
        interviewerIds: ["user-1", "user-2"]
      })
    );
  });
});
