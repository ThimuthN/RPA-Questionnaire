import { StatusPill } from "@/components/primitives/StatusPill";
import type {
  CandidateMilestoneStatus,
  CandidateMilestoneType
} from "@/lib/candidates/milestones";
import type {
  CandidateAssessmentStatus,
  CandidateNoteType
} from "@/lib/candidates/types";
import {
  candidateMilestoneStatusLabels,
  candidateMilestoneTypeLabels
} from "@/lib/candidates/milestones";
import {
  candidateAssessmentStatusLabels,
  candidateNoteTypeLabels
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
