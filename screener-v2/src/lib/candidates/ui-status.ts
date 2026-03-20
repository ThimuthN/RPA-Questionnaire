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
    case "reviewing":
      return {
        stage: "screening",
        finalDecision: "in_process",
        nextAction: "follow_up",
        screeningStatus: "pending"
      };
    case "test_sent":
      return {
        stage: "testing",
        finalDecision: "in_process",
        nextAction: "send_test",
        screeningStatus: "passed"
      };
    case "result_ready":
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
    case "on_hold":
      return {
        stage: "decision",
        finalDecision: "on_hold",
        nextAction: "follow_up"
      };
    case "rejected":
      return {
        stage: "closed",
        finalDecision: "rejected",
        nextAction: "close_profile"
      };
    case "new":
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

  if (candidate.finalDecision === "on_hold" && candidate.nextAction === "follow_up") {
    return "on_hold";
  }

  if (
    candidate.latestAssessmentStatus === "passed" ||
    candidate.latestAssessmentStatus === "review" ||
    candidate.latestAssessmentStatus === "failed" ||
    (candidate.stage === "decision" && candidate.nextAction === "review_result")
  ) {
    return "result_ready";
  }

  if (
    candidate.latestAssessmentStatus === "invited" ||
    candidate.latestAssessmentStatus === "in_progress" ||
    candidate.stage === "testing" ||
    candidate.nextAction === "send_test"
  ) {
    return "test_sent";
  }

  if (candidate.stage === "screening" || candidate.screeningStatus === "pending") {
    return "reviewing";
  }

  return "new";
}
