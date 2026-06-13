import { candidateStageLabels, type CandidateStage } from "@/lib/candidates/types";

export function getCandidateStageLabel(stage: CandidateStage | "new" | string) {
  if (stage === "new") return candidateStageLabels.pipeline;
  return candidateStageLabels[stage as CandidateStage] ?? stage;
}
