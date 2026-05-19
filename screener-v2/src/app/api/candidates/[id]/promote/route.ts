import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { candidateStageValues, type CandidateStage } from "@/lib/candidates/types";
import { cuidLike } from "@/lib/tokens/token-service";

const stageOrder: Record<CandidateStage, number> = {
  new: 1,
  screening: 2,
  interview: 3,
  testing: 4,
  decision: 5,
  offer: 6,
  closed: 7
};

const nextStage: Record<CandidateStage, CandidateStage | null> = {
  new: "screening",
  screening: "interview",
  interview: "testing",
  testing: "decision",
  decision: "offer",
  offer: "closed",
  closed: null
};

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession();
  const { id: candidateId } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, stage: true }
  });

  if (!candidate) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  const currentStage = candidate.stage as CandidateStage;
  const next = nextStage[currentStage];

  if (!next) {
    return Response.json(
      { error: `Cannot promote from stage ${currentStage}` },
      { status: 400 }
    );
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
