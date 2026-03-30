import type { Prisma } from "@prisma/client";
import { cuidLike } from "@/lib/tokens/token-service";

type CandidateAssessmentLinkTx = Pick<
  Prisma.TransactionClient,
  "candidateAssessment" | "candidateAssessmentAttempt"
>;

export async function linkCandidateAssessmentAttemptInTx(args: {
  tx: CandidateAssessmentLinkTx;
  candidateAssessmentId: string;
  attemptId: string;
  linkedAt?: Date;
}) {
  await args.tx.candidateAssessmentAttempt.upsert({
    where: {
      attemptId: args.attemptId
    },
    update: {
      candidateAssessmentId: args.candidateAssessmentId,
      linkedAt: args.linkedAt
    },
    create: {
      id: cuidLike(),
      candidateAssessmentId: args.candidateAssessmentId,
      attemptId: args.attemptId,
      ...(args.linkedAt ? { linkedAt: args.linkedAt } : {})
    }
  });

  await syncCandidateAssessmentLatestAttemptInTx({
    tx: args.tx,
    candidateAssessmentId: args.candidateAssessmentId
  });
}

export async function syncCandidateAssessmentLatestAttemptInTx(args: {
  tx: CandidateAssessmentLinkTx;
  candidateAssessmentId: string;
}) {
  const latest = await args.tx.candidateAssessmentAttempt.findFirst({
    where: {
      candidateAssessmentId: args.candidateAssessmentId
    },
    orderBy: [{ linkedAt: "desc" }, { id: "desc" }],
    select: {
      attemptId: true
    }
  });

  await args.tx.candidateAssessment.update({
    where: { id: args.candidateAssessmentId },
    data: {
      attemptId: latest?.attemptId ?? null
    }
  });
}
