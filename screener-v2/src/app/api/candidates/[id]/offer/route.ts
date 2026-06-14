import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { sendEmailSafe, offerSentEmail, adHocEmail, getOrgName } from "@/lib/email";

const offerSchema = z.object({
  action: z.enum(["upsert", "send", "revoke", "submit_for_approval"]),
  compensationType: z.string().optional(),
  compensationAmount: z.string().optional(),
  currency: z.string().optional(),
  targetStartDate: z.string().optional(),
  expiresAt: z.string().optional(),
  offerNotes: z.string().optional(),
});

function mapOffer(row: {
  id: string;
  status: string;
  compensationType: string;
  compensationAmount: number | null;
  currency: string;
  targetStartDate: Date | null;
  expiresAt: Date | null;
  offerNotes: string | null;
  sentAt: Date | null;
  respondedAt: Date | null;
}) {
  return {
    id: row.id,
    status: row.status,
    compensationType: row.compensationType,
    compensationAmount: row.compensationAmount,
    currency: row.currency,
    targetStartDate: row.targetStartDate?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    offerNotes: row.offerNotes,
    sentAt: row.sentAt?.toISOString() ?? null,
    respondedAt: row.respondedAt?.toISOString() ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const offer = await prisma.candidateOffer.findUnique({ where: { candidateId: id } });
  return NextResponse.json({ offer: offer ? mapOffer(offer) : null });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = offerSchema.parse(await request.json());

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        departmentId: true,
        positionAppliedFor: true,
        departmentCandidacies: {
          where: { status: "active" },
          take: 1,
          select: {
            teamAssignments: {
              where: { isActive: true },
              select: { user: { select: { email: true } } },
            },
          },
        },
      },
    });
    if (!candidate) {
      return NextResponse.json({ ok: false, message: "Candidate not found" }, { status: 404 });
    }

    const perm = await requirePermissionForDepartment(auth.session, "manage_candidates", candidate.departmentId);
    if (!perm.ok) return perm.response;

    if (body.action === "submit_for_approval") {
      const existing = await prisma.candidateOffer.findUnique({
        where: { candidateId: id },
        include: { approvalSteps: true },
      });
      if (!existing) {
        return NextResponse.json({ ok: false, message: "Create an offer before submitting for approval" }, { status: 400 });
      }
      if (existing.status !== "draft") {
        return NextResponse.json({ ok: false, message: "Only draft offers can be submitted for approval" }, { status: 400 });
      }

      // Find approval chain for this offer's department
      const chain = await prisma.offerApprovalChain.findFirst({
        where: { departmentId: candidate.departmentId },
        include: { steps: { orderBy: { sortOrder: "asc" }, include: { approver: { select: { id: true, name: true, email: true } } } } },
      });

      if (!chain || chain.steps.length === 0) {
        // No approval chain configured — auto-approve
        const updated = await prisma.candidateOffer.update({
          where: { candidateId: id },
          data: { status: "approved" },
        });
        return NextResponse.json({ ok: true, offer: mapOffer(updated), autoApproved: true });
      }

      // Create per-offer approval steps from chain template
      await prisma.$transaction(async (tx) => {
        await tx.offerApprovalStep.deleteMany({ where: { offerId: existing.id } });
        await tx.offerApprovalStep.createMany({
          data: chain.steps.map((s) => ({
            id: `${existing.id}_${s.sortOrder}`,
            offerId: existing.id,
            approverId: s.approverId,
            sortOrder: s.sortOrder,
            status: "pending",
          })),
        });
        await tx.candidateOffer.update({
          where: { id: existing.id },
          data: { status: "submitted_for_approval" },
        });
      });

      // Email first approver
      const firstApprover = chain.steps[0]?.approver;
      if (firstApprover?.email) {
        const approvalEmailSubject = `Offer approval required — ${candidate.fullName}`;
        const { subject, html } = adHocEmail({
          orgName: getOrgName(),
          candidateName: firstApprover.name ?? firstApprover.email,
          bodyHtml: `An offer for <strong>${candidate.fullName}</strong> has been submitted for your approval. Please log in to review and approve or reject it.`,
          subject: approvalEmailSubject,
        });
        void sendEmailSafe({ to: firstApprover.email, subject, html, template: "ad_hoc", sentById: auth.session.userId ?? undefined });
      }

      const updated = await prisma.candidateOffer.findUnique({ where: { candidateId: id } });
      return NextResponse.json({ ok: true, offer: updated ? mapOffer(updated) : null });
    }

    if (body.action === "send") {
      const existing = await prisma.candidateOffer.findUnique({ where: { candidateId: id } });
      if (!existing) {
        return NextResponse.json({ ok: false, message: "Create an offer before marking it sent" }, { status: 400 });
      }
      const updated = await prisma.candidateOffer.update({
        where: { candidateId: id },
        data: { status: "sent", sentAt: new Date() },
      });

      // Fire offer email to candidate + CC hiring team
      const teamEmails = candidate.departmentCandidacies[0]?.teamAssignments.map((a) => a.user.email) ?? [];
      const ccEmails = teamEmails.filter((e) => e !== candidate.email);
      const currency = existing.currency ?? "USD";
      const amount = existing.compensationAmount;
      const compensationFormatted = amount
        ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount) +
          (existing.compensationType === "hourly" ? " / hr" : existing.compensationType === "contract" ? " / day" : " / yr")
        : "Discussed separately";
      const { subject, html } = offerSentEmail({
        orgName: getOrgName(),
        candidateName: candidate.fullName,
        roleTitle: candidate.positionAppliedFor ?? "the position",
        compensationFormatted,
        targetStartDate: existing.targetStartDate?.toLocaleDateString() ?? undefined,
        expiresAt: existing.expiresAt?.toLocaleDateString() ?? undefined,
        offerNotes: existing.offerNotes ?? undefined,
        recruiterName: auth.session.name ?? undefined,
        recruiterEmail: auth.session.email ?? undefined,
      });
      void sendEmailSafe({ to: candidate.email, cc: ccEmails, subject, html, template: "offer_sent", candidateId: id, sentById: auth.session.userId ?? undefined });

      return NextResponse.json({ ok: true, offer: mapOffer(updated) });
    }

    if (body.action === "revoke") {
      const existing = await prisma.candidateOffer.findUnique({ where: { candidateId: id } });
      if (!existing) {
        return NextResponse.json({ ok: false, message: "No offer to revoke" }, { status: 400 });
      }
      const updated = await prisma.candidateOffer.update({
        where: { candidateId: id },
        data: { status: "draft", sentAt: null },
      });
      return NextResponse.json({ ok: true, offer: mapOffer(updated) });
    }

    // upsert
    const amount = body.compensationAmount ? parseInt(body.compensationAmount, 10) : null;
    const offer = await prisma.candidateOffer.upsert({
      where: { candidateId: id },
      create: {
        candidateId: id,
        status: "draft",
        compensationType: body.compensationType ?? "salary",
        compensationAmount: isNaN(amount!) ? null : amount,
        currency: body.currency ?? "USD",
        targetStartDate: body.targetStartDate ? new Date(body.targetStartDate) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        offerNotes: body.offerNotes?.trim() || null,
        createdById: auth.session.userId ?? null,
      },
      update: {
        compensationType: body.compensationType ?? "salary",
        compensationAmount: isNaN(amount!) ? null : amount,
        currency: body.currency ?? "USD",
        targetStartDate: body.targetStartDate ? new Date(body.targetStartDate) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        offerNotes: body.offerNotes?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, offer: mapOffer(offer) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save offer";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
