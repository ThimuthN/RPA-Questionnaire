import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn()
    },
    candidateActivityEvent: {
      create: vi.fn()
    }
  }
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  getOrgName: vi.fn(() => "Northstar"),
  adHocEmail: vi.fn(() => ({ html: "<p>body</p>" })),
  applicationReceivedEmail: vi.fn(() => ({ subject: "Application received", html: "<p>body</p>" })),
  interviewInviteEmail: vi.fn(() => ({ subject: "Interview invite", html: "<p>body</p>" })),
  stageAdvanceEmail: vi.fn(() => ({ subject: "Stage advance", html: "<p>body</p>" })),
  rejectionEmail: vi.fn(() => ({ subject: "Rejection", html: "<p>body</p>" })),
  offerSentEmail: vi.fn(() => ({ subject: "Offer sent", html: "<p>body</p>" })),
  screenerInviteEmail: vi.fn(() => ({ subject: "Assessment invite", html: "<p>body</p>" }))
}));

import { POST } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email";

describe("/api/candidates/[id]/emails POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "user-1",
        email: "owner@example.com",
        name: "Owner",
      }
    } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);
    vi.mocked(sendEmail).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.candidateActivityEvent.create).mockResolvedValue({ id: "event-1" } as never);
  });

  it("prefers the active department candidacy for department-backed sending", async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      id: "cand-1",
      fullName: "Casey Candidate",
      email: "casey@example.com",
      departmentId: "legacy-dept",
      departmentCandidacies: [
        {
          departmentId: "active-dept",
          teamAssignments: []
        }
      ]
    } as never);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: "ad_hoc",
          to: "casey@example.com",
          subject: "Hello",
          bodyOverride: "Body"
        })
      }),
      {
        params: Promise.resolve({ id: "cand-1" })
      }
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: "cand-1",
        departmentId: "active-dept"
      })
    );
  });

  it("falls back to the candidate department when there is no active candidacy", async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      id: "cand-2",
      fullName: "Jordan Candidate",
      email: "jordan@example.com",
      departmentId: "dept-2",
      departmentCandidacies: []
    } as never);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-2/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: "ad_hoc",
          to: "jordan@example.com",
          subject: "Hello",
          bodyOverride: "Body"
        })
      }),
      {
        params: Promise.resolve({ id: "cand-2" })
      }
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: "cand-2",
        departmentId: "dept-2"
      })
    );
  });
});
