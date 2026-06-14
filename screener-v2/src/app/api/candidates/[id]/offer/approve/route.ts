import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { sendEmailSafe, adHocEmail, getOrgName } from "@/lib/email";
import { createNotification } from "@/lib/notifications/service";

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
        include: { approver: { select: { id: true, name: true, email: true } } },
      },
      candidate: { select: { fullName: true, departmentId: true } },
    },
  });

  if (!offer) return NextResponse.json({ ok: false, message: "Offer not found" }, { status: 404 });
  if (offer.status !== "submitted_for_approval") {
    return NextResponse.json({ ok: false, message: "Only offers pending approval can be approved" }, { status: 400 });
  }

  const pendingStep = offer.approvalSteps.find((s) => s.status === "pending");
  if (!pendingStep) return NextResponse.json({ ok: false, message: "No pending approval step" }, { status: 400 });
  if (pendingStep.approverId !== auth.session.userId) {
    return NextResponse.json({ ok: false, message: "You are not the current approver" }, { status: 403 });
  }

  await prisma.offerApprovalStep.update({
    where: { id: pendingStep.id },
    data: { status: "approved", note: body.note?.trim() || null, decidedAt: new Date() },
  });

  const remainingSteps = offer.approvalSteps.filter(
    (s) => s.sortOrder > pendingStep.sortOrder && s.status === "pending"
  );

  if (remainingSteps.length > 0) {
    // Email next approver
    const next = remainingSteps[0]!;
    const nextApproverEmailSubject = `Offer approval required — ${offer.candidate.fullName}`;
    const { subject, html } = adHocEmail({
      orgName: getOrgName(),
      candidateName: next.approver.name ?? next.approver.email,
      bodyHtml: `An offer for <strong>${offer.candidate.fullName}</strong> requires your approval. Please log in to review and approve or reject it.`,
      subject: nextApproverEmailSubject,
    });
    void sendEmailSafe({ to: next.approver.email, subject, html, template: "ad_hoc", sentById: auth.session.userId ?? undefined });
    return NextResponse.json({ ok: true, status: "submitted_for_approval" });
  }

  // All steps approved
  const updated = await prisma.candidateOffer.update({
    where: { id: offer.id },
    data: { status: "approved" },
    select: { id: true, status: true },
  });

  // Notify all approvers that the offer is fully approved
  const approverIds = [...new Set(offer.approvalSteps.map((s) => s.approverId).filter(Boolean))] as string[];
  void Promise.all(
    approverIds.map((userId) =>
      createNotification({
        userId,
        type: "offer_approved",
        title: `Offer approved — ${offer.candidate.fullName}`,
        body: "All approval steps completed. The offer is ready to send.",
        entityType: "candidate",
        entityId: id,
        entityHref: `/people/candidates/${id}`,
      })
    )
  ).catch(() => undefined);

  return NextResponse.json({ ok: true, status: updated.status });
}
