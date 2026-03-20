import { StatusPill } from "@/components/primitives/StatusPill";
import type {
  CandidateAssessmentStatus,
  CandidateFinalDecision,
  CandidateNoteType,
  CandidateScreeningStatus,
  CandidateStage,
  CandidateUiStatus
} from "@/lib/candidates/types";
import {
  candidateAssessmentStatusLabels,
  candidateFinalDecisionLabels,
  candidateNoteTypeLabels,
  candidateScreeningStatusLabels,
  candidateStageLabels,
  candidateUiStatusLabels
} from "@/lib/candidates/types";

function assessmentTone(status: CandidateAssessmentStatus) {
  switch (status) {
    case "passed":
      return "emerald" as const;
    case "review":
      return "amber" as const;
    case "failed":
      return "red" as const;
    case "in_progress":
      return "blue" as const;
    case "invited":
      return "teal" as const;
    default:
      return "neutral" as const;
  }
}

function stageTone(stage: CandidateStage) {
  switch (stage) {
    case "offer":
      return "emerald" as const;
    case "closed":
      return "neutral" as const;
    case "testing":
      return "blue" as const;
    case "decision":
      return "amber" as const;
    default:
      return "teal" as const;
  }
}

function decisionTone(decision: CandidateFinalDecision) {
  switch (decision) {
    case "selected":
      return "emerald" as const;
    case "rejected":
      return "red" as const;
    case "on_hold":
      return "amber" as const;
    default:
      return "neutral" as const;
  }
}

function screeningTone(status: CandidateScreeningStatus) {
  switch (status) {
    case "passed":
      return "emerald" as const;
    case "failed":
      return "red" as const;
    case "on_hold":
      return "amber" as const;
    default:
      return "neutral" as const;
  }
}

function uiStatusTone(status: CandidateUiStatus) {
  switch (status) {
    case "need_review":
      return "amber" as const;
    case "moved_forward":
      return "emerald" as const;
    case "rejected":
      return "red" as const;
    case "in_progress":
      return "teal" as const;
    default:
      return "neutral" as const;
  }
}

export function CandidateStagePill({ stage }: { stage: CandidateStage }) {
  return <StatusPill label={candidateStageLabels[stage]} tone={stageTone(stage)} />;
}

export function CandidateAssessmentPill({ status }: { status: CandidateAssessmentStatus }) {
  return <StatusPill label={candidateAssessmentStatusLabels[status]} tone={assessmentTone(status)} />;
}

export function CandidateUiStatusPill({ status }: { status: CandidateUiStatus }) {
  return <StatusPill label={candidateUiStatusLabels[status]} tone={uiStatusTone(status)} />;
}

export function CandidateDecisionPill({ decision }: { decision: CandidateFinalDecision }) {
  return <StatusPill label={candidateFinalDecisionLabels[decision]} tone={decisionTone(decision)} />;
}

export function CandidateScreeningPill({
  status
}: {
  status?: CandidateScreeningStatus;
}) {
  if (!status) {
    return <StatusPill label="No screening" tone="neutral" />;
  }

  return <StatusPill label={candidateScreeningStatusLabels[status]} tone={screeningTone(status)} />;
}

export function CandidateNoteTypePill({ type }: { type: CandidateNoteType }) {
  return <StatusPill label={candidateNoteTypeLabels[type]} tone="purple" />;
}
