import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";
import { createExternalAssessmentUploadToken } from "@/lib/external-assessment-upload-token";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  const { id: candidateId, assessmentId } = await params;

  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const perm = await requireCandidatePermission(session.session, candidateId, "manage_candidates");
  if (!perm.ok) return perm.response;

  const assessment = await prisma.candidateExternalAssessment.findFirst({
    where: { id: assessmentId, candidateId }
  });
  if (!assessment) return NextResponse.json({ error: "Assessment not found." }, { status: 404 });

  const body = await request.json().catch(() => ({})) as { label?: string };
  const token = await createExternalAssessmentUploadToken(assessmentId, body.label);

  const origin = new URL(request.url).origin;
  const url = `${origin}/upload/${token.token}`;

  return NextResponse.json({ token: token.token, url, expiresAt: token.expiresAt.toISOString() }, { status: 201 });
}
