import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";

const RejectSchema = z.object({
  reason: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = RejectSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ ok: false, message: "Invalid input" }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { id: true, departmentId: true, orgStage: true }
  });

  if (!candidate) {
    return NextResponse.json({ ok: false, message: "Candidate not found" }, { status: 404 });
  }

  const permission = await requirePermissionForDepartment(auth.session, "manage_candidates", candidate.departmentId);
  if (!permission.ok) return permission.response;

  await prisma.$transaction(async (tx) => {
    await tx.candidate.update({
      where: { id },
      data: {
        stage: "finalized",
        orgStatus: "org_rejected",
        orgStage: "finalized",
        finalizedAs: "rejected",
        nextAction: "none",
        updatedAt: new Date()
      }
    });

    await tx.departmentCandidacy.updateMany({
      where: { candidateId: id, status: "active" },
      data: { status: "dept_rejected", updatedAt: new Date() }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: id,
        actorId: auth.session.userId,
        actorName: auth.session.name || auth.session.email || "System",
        event: "rejected",
        detail: body.data.reason?.trim() || "Rejected",
        createdAt: new Date()
      }
    });
  });

  return NextResponse.json({ ok: true });
}
