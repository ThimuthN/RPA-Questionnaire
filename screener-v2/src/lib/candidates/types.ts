export const candidateStageValues = [
  "new",
  "screening",
  "interview",
  "testing",
  "decision",
  "offer",
  "closed"
] as const;

export type CandidateStage = (typeof candidateStageValues)[number];

export const candidateFinalDecisionValues = [
  "in_process",
  "selected",
  "rejected",
  "on_hold"
] as const;

export type CandidateFinalDecision = (typeof candidateFinalDecisionValues)[number];

export const candidateNextActionValues = [
  "schedule_interview",
  "send_test",
  "review_result",
  "schedule_final",
  "prepare_offer",
  "close_profile",
  "follow_up",
  "none"
] as const;

export type CandidateNextAction = (typeof candidateNextActionValues)[number];

export const candidateScreeningStatusValues = [
  "pending",
  "passed",
  "failed",
  "on_hold"
] as const;

export type CandidateScreeningStatus = (typeof candidateScreeningStatusValues)[number];

export const candidateNoteTypeValues = [
  "screening",
  "interview",
  "technical",
  "decision",
  "general"
] as const;

export type CandidateNoteType = (typeof candidateNoteTypeValues)[number];

export const candidateAssessmentStatusValues = [
  "none",
  "invited",
  "in_progress",
  "passed",
  "review",
  "failed"
] as const;

export type CandidateAssessmentStatus = (typeof candidateAssessmentStatusValues)[number];

export const candidateUiStatusValues = [
  "in_progress",
  "need_review",
  "moved_forward",
  "rejected"
] as const;

export type CandidateUiStatus = (typeof candidateUiStatusValues)[number];

export const candidateStageLabels: Record<CandidateStage, string> = {
  new: "New",
  screening: "Screening",
  interview: "Interview",
  testing: "Testing",
  decision: "Decision",
  offer: "Offer",
  closed: "Closed"
};

export const candidateFinalDecisionLabels: Record<CandidateFinalDecision, string> = {
  in_process: "In Process",
  selected: "Selected",
  rejected: "Rejected",
  on_hold: "On Hold"
};

export const candidateNextActionLabels: Record<CandidateNextAction, string> = {
  schedule_interview: "Schedule 1st Interview",
  send_test: "Send Technical Test",
  review_result: "Evaluate Test",
  schedule_final: "Schedule Final Interview",
  prepare_offer: "Prepare Offer",
  close_profile: "Close Profile",
  follow_up: "Follow Up",
  none: "N/A"
};

export const candidateScreeningStatusLabels: Record<CandidateScreeningStatus, string> = {
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
  on_hold: "On Hold"
};

export const candidateNoteTypeLabels: Record<CandidateNoteType, string> = {
  screening: "Screening",
  interview: "Interview",
  technical: "Technical",
  decision: "Decision",
  general: "General"
};

export const candidateAssessmentStatusLabels: Record<CandidateAssessmentStatus, string> = {
  none: "Not sent",
  invited: "Sent",
  in_progress: "In progress",
  passed: "Passed",
  review: "Review",
  failed: "Failed"
};

export const candidateUiStatusLabels: Record<CandidateUiStatus, string> = {
  in_progress: "In progress",
  need_review: "Need review",
  moved_forward: "Moved forward",
  rejected: "Rejected"
};

export const resumeSourceOptions = [
  "LinkedIn",
  "Referral",
  "Job Portal",
  "Company Website",
  "Agency",
  "Other"
] as const;

export function isCandidateStage(value: string): value is CandidateStage {
  return (candidateStageValues as readonly string[]).includes(value);
}

export function isCandidateFinalDecision(value: string): value is CandidateFinalDecision {
  return (candidateFinalDecisionValues as readonly string[]).includes(value);
}

export function isCandidateNextAction(value: string): value is CandidateNextAction {
  return (candidateNextActionValues as readonly string[]).includes(value);
}

export function isCandidateScreeningStatus(value: string): value is CandidateScreeningStatus {
  return (candidateScreeningStatusValues as readonly string[]).includes(value);
}

export function isCandidateAssessmentStatus(value: string): value is CandidateAssessmentStatus {
  return (candidateAssessmentStatusValues as readonly string[]).includes(value);
}

export function isCandidateUiStatus(value: string): value is CandidateUiStatus {
  return (candidateUiStatusValues as readonly string[]).includes(value);
}
