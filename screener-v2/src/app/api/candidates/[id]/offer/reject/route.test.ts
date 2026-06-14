import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

const tx = {
  offerApprovalStep: {
    update: vi.fn()
  },
  candidateOffer: {
    update: vi.fn()
  }
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidateOffer: {
      findUnique: vi.fn()
    },
    candidateActivityEvent: {
      create: vi.fn().mockResolvedValue({})
    },
    $transaction: vi.fn(async (callback: (trx: typeof tx) => Promise<void>) => callback(tx))
  }
}));

import { POST } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

describe("POST /api/candidates/[id]/offer/reject", () => {
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

  it("returns the offer to draft and logs the rejection", async () => {
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue({
      id: "offer-1",
      status: "submitted_for_approval",
      approvalSteps: [
        {
          id: "step-1",
          approverId: "approver-1",
          status: "pending"
        }
      ]
    } as never);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Need changes" })
      }),
      {
        params: Promise.resolve({ id: "cand-1" })
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: "draft" });
    expect(tx.offerApprovalStep.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "step-1" },
        data: expect.objectContaining({ status: "rejected", note: "Need changes" })
      })
    );
    expect(tx.candidateOffer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "offer-1" },
        data: { status: "draft" }
      })
    );
    expect(vi.mocked(prisma.candidateActivityEvent.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event: "offer_rejected"
        })
      })
    );
  });
});
