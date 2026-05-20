import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { candidateStageValues, type CandidateStage } from "@/lib/candidates/types";
import { cuidLike } from "@/lib/tokens/token-service";

const stageOrder: Record<CandidateStage, number> = {
  applicant: 1,
  pipeline: 2,
  screening: 3,
  interview: 4,
  testing: 5,
  decision: 6,
  closed: 7
};

const nextStage: Record<CandidateStage, CandidateStage | null> = {
  applicant: "pipeline",
  pipeline: "screening",
  screening: "interview",
  interview: "testing",
  testing: "decision",
  decision: "closed",
  closed: null
};

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { session } = auth;
  const { id: candidateId } = await params;

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

  const currentStage = candidate.stage as CandidateStage;
  const next = nextStage[currentStage];

  if (!next) {
    return Response.json(
      { error: `Cannot promote from stage ${currentStage}` },
      { status: 400 }
    );
  }

  // Validation: Cannot promote to closed without passed assessment
  if (next === "closed") {
    const passedAssessment = candidate.assessments.find((a) => a.attempt?.result?.pass === true);
    if (!passedAssessment) {
      return Response.json(
        { error: "Cannot close candidate without a passed assessment. Complete and pass an assessment first." },
        { status: 400 }
      );
    }
  }

  // Validation: Cannot promote to testing without a completed assessment
  if (next === "testing" && currentStage === "screening") {
    const hasAssessment = candidate.assessments.length > 0;
    if (!hasAssessment) {
      return Response.json(
        { error: "Cannot advance to testing without an assessment. Create an assessment first." },
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
        detail: `${candidate.stage} → ${next}`,
        createdAt: new Date()
      }
    });
  });

  return Response.json({ success: true, stage: next });
}
