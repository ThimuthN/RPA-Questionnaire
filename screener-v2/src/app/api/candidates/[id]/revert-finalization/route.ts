import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { id: true, departmentId: true, orgStage: true, finalizedAs: true }
  });

  if (!candidate) {
    return NextResponse.json({ ok: false, message: "Candidate not found" }, { status: 404 });
  }

  const permission = await requirePermissionForDepartment(auth.session, "manage_candidates", candidate.departmentId);
  if (!permission.ok) return permission.response;

  if (candidate.orgStage !== "finalized") {
    return NextResponse.json({ ok: false, message: "Candidate is not finalized." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    let newStage: string;
    if (candidate.finalizedAs === "hired") {
      newStage = "advanced_review";
    } else if (candidate.finalizedAs === "rejected") {
      newStage = "pipeline";
    } else {
      newStage = "pipeline";
    }

    await tx.candidate.update({
      where: { id },
      data: {
        orgStatus: "active",
        orgStage: "active",
        finalizedAs: null,
        stage: newStage,
        nextAction: "none",
        updatedAt: new Date()
      }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: id,
        actorId: auth.session.userId,
        actorName: auth.session.name || auth.session.email || "System",
        event: "finalization_reverted",
        detail: candidate.finalizedAs ? `Reverted ${candidate.finalizedAs}` : "Reverted finalization",
        createdAt: new Date()
      }
    });
  });

  return NextResponse.json({ ok: true });
}
