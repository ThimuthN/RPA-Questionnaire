import { StatusPill } from "@/components/primitives/StatusPill";
import type {
  CandidateMilestoneMode,
  CandidateMilestoneStatus,
  CandidateMilestoneType
} from "@/lib/candidates/milestones";
import type {
  CandidateAssessmentStatus,
  CandidateNoteType,
  CandidateScreeningStatus,
  CandidateStage
} from "@/lib/candidates/types";
import {
  candidateMilestoneModeLabels,
  candidateMilestoneStatusLabels,
  candidateMilestoneTypeLabels
} from "@/lib/candidates/milestones";
import {
  candidateAssessmentStatusLabels,
  candidateNoteTypeLabels,
  candidateScreeningStatusLabels,
  candidateStageLabels
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
    case "finalized":
      return "emerald" as const;
    case "advanced_review":
      return "blue" as const;
    default:
      return "teal" as const;
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

function milestoneStatusTone(status: CandidateMilestoneStatus) {
  switch (status) {
    case "done":
      return "emerald" as const;
    case "in_progress":
      return "blue" as const;
    case "skipped":
      return "neutral" as const;
    default:
      return "amber" as const;
  }
}

function milestoneModeTone(mode: CandidateMilestoneMode) {
  return mode === "platform" ? ("blue" as const) : ("neutral" as const);
}

export function CandidateAssessmentPill({ status }: { status: CandidateAssessmentStatus }) {
  return <StatusPill label={candidateAssessmentStatusLabels[status]} tone={assessmentTone(status)} />;
}

export function CandidateNoteTypePill({ type }: { type: CandidateNoteType }) {
  return <StatusPill label={candidateNoteTypeLabels[type]} tone="purple" />;
}

export function CandidateMilestoneStatusPill({ status }: { status: CandidateMilestoneStatus }) {
  return <StatusPill label={candidateMilestoneStatusLabels[status]} tone={milestoneStatusTone(status)} />;
}


export function CandidateMilestoneTypePill({ type }: { type: CandidateMilestoneType }) {
  return <StatusPill label={candidateMilestoneTypeLabels[type]} tone="neutral" />;
}
