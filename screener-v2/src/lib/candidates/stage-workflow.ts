import { candidateStageValues, type CandidateStage } from "@/lib/candidates/types";

export const candidateStageOrder: Record<CandidateStage, number> = {
  applicant: 1,
  pipeline: 2,
  screening: 3,
  interview: 4,
  testing: 5,
  decision: 6,
  closed: 7
};

export const candidateStageActionLabels: Record<CandidateStage, string> = {
  applicant: "Move to Applicants",
  pipeline: "Move to Pipeline",
  screening: "Move to Screener",
  interview: "Move to Interview",
  testing: "Move to Advanced Review",
  decision: "Move to Finalized",
  closed: "Close Candidate"
};

export function normalizeCandidateStage(stage: string): CandidateStage {
  return stage === "new" ? "pipeline" : (stage as CandidateStage);
}

export function isCandidateStageValue(stage: string): stage is CandidateStage {
  return (candidateStageValues as readonly string[]).includes(stage);
}

export function getNextCandidateStage(stage: CandidateStage): CandidateStage | null {
  const currentOrder = candidateStageOrder[stage];
  return candidateStageValues.find((value) => candidateStageOrder[value] === currentOrder + 1) ?? null;
}

export function getForwardCandidateStages(stage: CandidateStage): CandidateStage[] {
  const currentOrder = candidateStageOrder[stage];
  return candidateStageValues.filter((value) => candidateStageOrder[value] > currentOrder);
}

export function canAdvanceCandidateStage(current: CandidateStage, target: CandidateStage) {
  return candidateStageOrder[target] > candidateStageOrder[current];
}
