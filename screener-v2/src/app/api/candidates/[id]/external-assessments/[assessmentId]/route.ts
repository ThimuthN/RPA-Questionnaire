import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { deleteCandidateExternalAssessment } from "@/lib/db/candidates";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  const { id, assessmentId } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  // Verify the assessment belongs to this candidate
  const existing = await prisma.candidateExternalAssessment.findFirst({
    where: { id: assessmentId, candidateId: id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteCandidateExternalAssessment(assessmentId);
  return NextResponse.json({ ok: true });
}
