import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { logError } from "@/lib/server/logger";

const schema = z.object({ note: z.string().optional() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = schema.parse(await request.json().catch(() => ({})));

  const offer = await prisma.candidateOffer.findUnique({
    where: { candidateId: id },
    include: {
      approvalSteps: {
        orderBy: { sortOrder: "asc" },
        where: { status: "pending" },
      },
    },
  });

  if (!offer) return NextResponse.json({ ok: false, message: "Offer not found" }, { status: 404 });
  if (offer.status !== "submitted_for_approval") {
    return NextResponse.json({ ok: false, message: "Only offers pending approval can be rejected" }, { status: 400 });
  }

  const pendingStep = offer.approvalSteps[0];
  if (!pendingStep) return NextResponse.json({ ok: false, message: "No pending step" }, { status: 400 });
  if (pendingStep.approverId !== auth.session.userId) {
    return NextResponse.json({ ok: false, message: "You are not the current approver" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.offerApprovalStep.update({
      where: { id: pendingStep.id },
      data: { status: "rejected", note: body.note?.trim() || null, decidedAt: new Date() },
    });
    await tx.candidateOffer.update({
      where: { id: offer.id },
      data: { status: "draft" },
    });
  });

  await prisma.candidateActivityEvent.create({
    data: {
      candidateId: id,
      actorId: auth.session.userId ?? null,
      actorName: auth.session.name ?? null,
      event: "offer_rejected",
      entityType: "offer",
      entityId: id,
      detail: `${auth.session.name ?? auth.session.email ?? "An approver"} rejected the offer approval step and returned the offer to draft.`
    }
  }).catch((err: unknown) => {
    logError("offer_rejected_activity_failed", { candidateId: id, error: err instanceof Error ? err.message : String(err) });
  });

  return NextResponse.json({ ok: true, status: "draft" });
}
