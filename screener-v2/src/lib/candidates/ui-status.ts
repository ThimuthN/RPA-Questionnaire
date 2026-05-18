import { prisma } from '@/lib/db/prisma';
import type { CandidateStage, CandidateFinalDecision, CandidateNextAction, CandidateUiStatus } from '@/lib/candidates/types';

/**
 * Compute the UI status for a candidate based on stage, finalDecision, and nextAction.
 * Maps complex state into a simplified 4-value UI status for filtering and display.
 */
export function getCandidateUiStatus(candidate: {
  stage: CandidateStage;
  finalDecision: CandidateFinalDecision;
  nextAction?: CandidateNextAction;
}): CandidateUiStatus {
  // Rejected candidates stay rejected regardless of other fields
  if (candidate.finalDecision === 'rejected') {
    return 'rejected';
  }

  // Selected/moved forward candidates
  if (candidate.finalDecision === 'selected') {
    return 'moved_forward';
  }

  // On-hold candidates need review
  if (candidate.finalDecision === 'on_hold') {
    return 'need_review';
  }

  // In-process candidates: check if they're waiting for review
  if (candidate.nextAction === 'review_result') {
    return 'need_review';
  }

  // Default: everything else is in_progress
  return 'in_progress';
}

/**
 * Reverse mapping: convert a CandidateUiStatus back to stored fields.
 * This is used when bulk-updating candidates by their UI status.
 */
export function candidateUiStatusToStoredFields(status: CandidateUiStatus): {
  stage: CandidateStage;
  finalDecision: CandidateFinalDecision;
  nextAction: CandidateNextAction;
} {
  switch (status) {
    case 'rejected':
      return {
        stage: 'closed',
        finalDecision: 'rejected',
        nextAction: 'none',
      };
    case 'moved_forward':
      return {
        stage: 'offer',
        finalDecision: 'selected',
        nextAction: 'none',
      };
    case 'need_review':
      return {
        stage: 'testing',
        finalDecision: 'in_process',
        nextAction: 'review_result',
      };
    case 'in_progress':
    default:
      return {
        stage: 'screening',
        finalDecision: 'in_process',
        nextAction: 'schedule_interview',
      };
  }
}

/**
 * Sync the uiStatus column for a candidate after mutation.
 * Call this in every candidate update route to keep the column current.
 */
export async function syncCandidateUiStatus(
  tx: typeof prisma,
  candidateId: string
): Promise<void> {
  const candidate = await tx.candidate.findUnique({
    where: { id: candidateId },
    select: { stage: true, finalDecision: true, nextAction: true },
  });

  if (!candidate) {
    return;
  }

  const newStatus = getCandidateUiStatus({
    stage: candidate.stage as CandidateStage,
    finalDecision: candidate.finalDecision as CandidateFinalDecision,
    nextAction: candidate.nextAction as CandidateNextAction | undefined,
  });

  await tx.candidate.update({
    where: { id: candidateId },
    data: { uiStatus: newStatus },
  });
}

/**
 * Sync uiStatus for multiple candidates (used in bulk operations).
 */
export async function syncCandidatesUiStatus(
  tx: typeof prisma,
  candidateIds: string[]
): Promise<void> {
  if (candidateIds.length === 0) {
    return;
  }

  // Fetch all candidates
  const candidates = await tx.candidate.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, stage: true, finalDecision: true, nextAction: true },
  });

  // Batch update their UI statuses
  for (const candidate of candidates) {
    const newStatus = getCandidateUiStatus({
      stage: candidate.stage as CandidateStage,
      finalDecision: candidate.finalDecision as CandidateFinalDecision,
      nextAction: candidate.nextAction as CandidateNextAction | undefined,
    });
    await tx.candidate.update({
      where: { id: candidate.id },
      data: { uiStatus: newStatus },
    });
  }
}
