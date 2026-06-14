import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidateOffer: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    offerApprovalStep: {
      update: vi.fn()
    },
    candidateActivityEvent: {
      create: vi.fn().mockResolvedValue({})
    }
  }
}));

vi.mock("@/lib/email", () => ({
  sendEmailSafe: vi.fn(),
  adHocEmail: vi.fn(() => ({ subject: "Approval", html: "<p>Approval</p>" })),
  getOrgName: vi.fn(() => "Northstar")
}));

vi.mock("@/lib/notifications/service", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined)
}));

import { POST } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/service";

describe("POST /api/candidates/[id]/offer/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "approver-1",
        name: "Approver One",
        email: "approver1@example.com"
      }
    } as never);
  });

  it("advances approval to the next approver and logs the step completion", async () => {
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue({
      id: "offer-1",
      status: "submitted_for_approval",
      candidate: {
        fullName: "Casey Candidate",
        departmentId: "dept-1"
      },
      approvalSteps: [
        {
          id: "step-1",
          approverId: "approver-1",
          sortOrder: 1,
          status: "pending",
          approver: { id: "approver-1", name: "Approver One", email: "approver1@example.com" }
        },
        {
          id: "step-2",
          approverId: "approver-2",
          sortOrder: 2,
          status: "pending",
          approver: { id: "approver-2", name: "Approver Two", email: "approver2@example.com" }
        }
      ]
    } as never);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Looks good" })
      }),
      {
        params: Promise.resolve({ id: "cand-1" })
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: "submitted_for_approval" });
    expect(vi.mocked(prisma.offerApprovalStep.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "step-1" },
        data: expect.objectContaining({ status: "approved", note: "Looks good" })
      })
    );
    expect(vi.mocked(prisma.candidateActivityEvent.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event: "offer_approval_step_approved"
        })
      })
    );
    expect(vi.mocked(createNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "approver-2",
        type: "offer_submitted_for_approval"
      })
    );
  });
});
