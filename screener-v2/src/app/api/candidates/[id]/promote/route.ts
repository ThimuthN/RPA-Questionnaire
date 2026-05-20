import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  canAdvanceCandidateStage,
  candidateStageOrder,
  getNextCandidateStage,
  isCandidateStageValue,
  normalizeCandidateStage
} from "@/lib/candidates/stage-workflow";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { session } = auth;
  const { id: candidateId } = await params;
  const body = await request.json().catch(() => ({}));

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      stage: true,
      departmentId: true,
      orgStage: true,
      assessments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          attempt: {
            select: {
              result: { select: { pass: true } }
            }
          }
        }
      }
    }
  });

  if (!candidate) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  const permissionCheck = await requirePermissionForDepartment(auth.session, "promote_candidate", candidate.departmentId);
  if (!permissionCheck.ok) {
    return permissionCheck.response;
  }

  if (candidate.orgStage === "finalized") {
    return Response.json({ error: "Finalized candidates cannot be promoted." }, { status: 400 });
  }

  const currentStage = normalizeCandidateStage(candidate.stage);
  const requestedStage = typeof body.stage === "string" ? body.stage : undefined;
  const next = requestedStage && isCandidateStageValue(requestedStage)
    ? requestedStage
    : getNextCandidateStage(currentStage);

  if (!next) {
    return Response.json(
      { error: `Cannot promote from stage ${currentStage}` },
      { status: 400 }
    );
  }

  if (!canAdvanceCandidateStage(currentStage, next)) {
    return Response.json(
      { error: `Cannot move candidate from ${currentStage} to ${next}.` },
      { status: 400 }
    );
  }

  if (next === "closed") {
    const passedAssessment = candidate.assessments.find((assessment) => assessment.attempt?.result?.pass === true);
    if (!passedAssessment) {
      return Response.json(
        { error: "Cannot close candidate without a passed assessment. Complete and pass an assessment first." },
        { status: 400 }
      );
    }
  }

  if (
    candidateStageOrder[next] >= candidateStageOrder.testing &&
    candidateStageOrder[currentStage] < candidateStageOrder.testing
  ) {
    const hasAssessment = candidate.assessments.length > 0;
    if (!hasAssessment) {
      return Response.json(
        { error: "Cannot advance to advanced review without an assessment. Create an assessment first." },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        stage: next,
        updatedAt: new Date()
      }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId,
        actorId: session.userId,
        event: "stage_advanced",
        detail: `${candidate.stage} -> ${next}`,
        createdAt: new Date()
      }
    });
  });

  return Response.json({ success: true, stage: next });
}
