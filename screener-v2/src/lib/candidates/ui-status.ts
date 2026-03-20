import type {
  CandidateAssessmentStatus,
  CandidateFinalDecision,
  CandidateNextAction,
  CandidateScreeningStatus,
  CandidateStage,
  CandidateUiStatus
} from "@/lib/candidates/types";

type CandidateStatusShape = {
  stage: CandidateStage;
  finalDecision: CandidateFinalDecision;
  nextAction: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
  latestAssessmentStatus?: CandidateAssessmentStatus;
};

type CandidateStoredStatus = {
  stage: CandidateStage;
  finalDecision: CandidateFinalDecision;
  nextAction: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
};

export function candidateUiStatusToStoredFields(status: CandidateUiStatus): CandidateStoredStatus {
  switch (status) {
    case "need_review":
      return {
        stage: "decision",
        finalDecision: "on_hold",
        nextAction: "review_result",
        screeningStatus: "passed"
      };
    case "moved_forward":
      return {
        stage: "interview",
        finalDecision: "in_process",
        nextAction: "schedule_interview",
        screeningStatus: "passed"
      };
    case "in_progress":
    case "rejected":
      return status === "rejected"
        ? {
        stage: "closed",
        finalDecision: "rejected",
        nextAction: "close_profile"
      }
        : {
            stage: "screening",
            finalDecision: "in_process",
            nextAction: "follow_up",
            screeningStatus: "pending"
          };
    default:
      return {
        stage: "new",
        finalDecision: "in_process",
        nextAction: "none"
      };
  }
}

export function getCandidateUiStatus(candidate: CandidateStatusShape): CandidateUiStatus {
  if (candidate.finalDecision === "rejected" || candidate.stage === "closed") {
    return "rejected";
  }

  if (candidate.stage === "interview") {
    return "moved_forward";
  }

  if (
    candidate.latestAssessmentStatus === "passed" ||
    candidate.latestAssessmentStatus === "review" ||
    candidate.latestAssessmentStatus === "failed" ||
    (candidate.stage === "decision" && candidate.nextAction === "review_result")
  ) {
    return "need_review";
  }

  return "in_progress";
}
