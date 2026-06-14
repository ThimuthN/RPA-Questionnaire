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
import { createNotification } from "@/lib/notifications/service";

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

  if (
    candidateStageOrder[next] >= candidateStageOrder.advanced_review &&
    candidateStageOrder[currentStage] < candidateStageOrder.advanced_review
  ) {
    const hasAssessment = candidate.assessments.length > 0;
    if (!hasAssessment) {
      return Response.json(
        { error: "Cannot advance to advanced review without an assessment. Create an assessment first." },
        { status: 400 }
      );
    }
  }

  // Milestone types that correspond to each candidate stage
  const stageToMilestoneType: Partial<Record<string, string[]>> = {
    screening: ["screener"],
    interview: ["interview"],
    advanced_review: ["review_round", "advanced_review"],
    finalized: ["finalized"]
  };

  await prisma.$transaction(async (tx) => {
    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        stage: next,
        updatedAt: new Date()
      }
    });

    // Advance the corresponding milestone to in_progress so both stay in sync
    const milestoneTypes = stageToMilestoneType[next];
    if (milestoneTypes) {
      const targetMilestone = await tx.candidateMilestone.findFirst({
        where: {
          candidateId,
          type: { in: milestoneTypes },
          status: "not_started"
        },
        orderBy: { sortOrder: "asc" }
      });

      if (targetMilestone) {
        await tx.candidateMilestone.update({
          where: { id: targetMilestone.id },
          data: { status: "in_progress" }
        });

        // Mark any earlier not_started milestones as skipped
        await tx.candidateMilestone.updateMany({
          where: {
            candidateId,
            sortOrder: { lt: targetMilestone.sortOrder },
            status: "not_started"
          },
          data: { status: "skipped" }
        });
      }
    }

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId,
        actorId: session.userId,
        actorName: session.name || session.email || "System",
        event: "stage_advanced",
        detail: `${candidate.stage} -> ${next}`,
        createdAt: new Date()
      }
    });
  });

  // Notify the HR owner if different from the acting user
  const fullCandidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { fullName: true, hrOwnerId: true },
  });
  if (fullCandidate?.hrOwnerId && fullCandidate.hrOwnerId !== session.userId) {
    void createNotification({
      userId: fullCandidate.hrOwnerId,
      type: "candidate_stage_advanced",
      title: `${fullCandidate.fullName} advanced to ${next}`,
      body: `Stage moved from ${candidate.stage} to ${next}.`,
      entityType: "candidate",
      entityId: candidateId,
      entityHref: `/people/candidates/${candidateId}`,
    }).catch(() => undefined);
  }

  return Response.json({ success: true, stage: next });
}
