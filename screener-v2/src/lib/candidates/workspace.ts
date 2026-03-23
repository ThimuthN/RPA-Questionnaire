import type {
  CandidateAssessmentStatus,
  CandidateNextAction,
  CandidateUiStatus
} from "@/lib/candidates/types";
import { getCandidateUiStatus } from "@/lib/candidates/ui-status";
import type { CandidateDetail, CandidateListItem, CandidateNoteRecord } from "@/lib/db/candidates";

export type CandidateOpenWorkBucket =
  | "needs_resume"
  | "test_not_sent"
  | "in_progress"
  | "ready_for_review"
  | "moved_forward"
  | "stalled";

export type CandidateListSort = "updated_desc" | "updated_asc" | "name_asc" | "stale_desc" | "inbox";

export interface CandidateWorkspaceItem extends CandidateListItem {
  uiStatus: CandidateUiStatus;
  latestAssessmentStatus: CandidateAssessmentStatus;
  latestActivityAt: string;
  staleDays: number;
  openWorkBucket: CandidateOpenWorkBucket;
}

export interface CandidateActivityItem {
  id: string;
  at: string;
  kind: "candidate" | "resume" | "note" | "assessment" | "result" | "milestone";
  title: string;
  detail: string;
}

export interface CandidateOpenWorkSummary {
  total: number;
  needsResume: number;
  testNotSent: number;
  inProgress: number;
  readyForReview: number;
  movedForward: number;
  stalled: number;
}

function daysSince(date: string) {
  const diff = Date.now() - Date.parse(date);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function latestAssessmentStatus(candidate: CandidateListItem): CandidateAssessmentStatus {
  return candidate.latestAssessment?.status ?? "none";
}

function latestActivityAt(candidate: CandidateListItem) {
  const dates = [candidate.updatedAt];
  if (candidate.latestAssessment?.submittedAt) dates.push(candidate.latestAssessment.submittedAt);
  if (candidate.latestAssessment?.startedAt) dates.push(candidate.latestAssessment.startedAt);
  if (candidate.latestAssessment?.createdAt) dates.push(candidate.latestAssessment.createdAt);
  return [...dates].sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? candidate.updatedAt;
}

function openWorkBucket(args: {
  hasResume: boolean;
  uiStatus: CandidateUiStatus;
  staleDays: number;
  assessmentStatus: CandidateAssessmentStatus;
  nextAction: CandidateNextAction;
}) {
  if (!args.hasResume) return "needs_resume" as const;
  if (args.staleDays >= 7 && args.uiStatus !== "moved_forward" && args.uiStatus !== "rejected") {
    return "stalled" as const;
  }
  if (args.assessmentStatus === "none") return "test_not_sent" as const;
  if (
    args.assessmentStatus === "passed" ||
    args.assessmentStatus === "review" ||
    args.assessmentStatus === "failed" ||
    args.nextAction === "review_result"
  ) {
    return "ready_for_review" as const;
  }
  if (args.uiStatus === "moved_forward") return "moved_forward" as const;
  return "in_progress" as const;
}

export function toCandidateWorkspaceItem(candidate: CandidateListItem): CandidateWorkspaceItem {
  const uiStatus = getCandidateUiStatus({
    stage: candidate.stage,
    finalDecision: candidate.finalDecision,
    nextAction: candidate.nextAction,
    screeningStatus: candidate.screeningStatus,
    latestAssessmentStatus: latestAssessmentStatus(candidate)
  });
  const activityAt = latestActivityAt(candidate);
  const staleDays = daysSince(activityAt);

  return {
    ...candidate,
    uiStatus,
    latestAssessmentStatus: latestAssessmentStatus(candidate),
    latestActivityAt: activityAt,
    staleDays,
    openWorkBucket: openWorkBucket({
      hasResume: candidate.hasResume,
      uiStatus,
      staleDays,
      assessmentStatus: latestAssessmentStatus(candidate),
      nextAction: candidate.nextAction
    })
  };
}

export function sortCandidateWorkspaceItems(items: CandidateWorkspaceItem[], sort: CandidateListSort) {
  const sorted = [...items];

  if (sort === "updated_asc") {
    return sorted.sort((left, right) => Date.parse(left.latestActivityAt) - Date.parse(right.latestActivityAt));
  }

  if (sort === "name_asc") {
    return sorted.sort((left, right) => left.fullName.localeCompare(right.fullName));
  }

  if (sort === "stale_desc") {
    return sorted.sort((left, right) => right.staleDays - left.staleDays);
  }

  if (sort === "inbox") {
    const bucketOrder: Record<CandidateOpenWorkBucket, number> = {
      ready_for_review: 0,
      stalled: 1,
      test_not_sent: 2,
      needs_resume: 3,
      in_progress: 4,
      moved_forward: 5
    };

    return sorted.sort((left, right) => {
      const byBucket = bucketOrder[left.openWorkBucket] - bucketOrder[right.openWorkBucket];
      if (byBucket !== 0) return byBucket;
      return right.staleDays - left.staleDays;
    });
  }

  return sorted.sort((left, right) => Date.parse(right.latestActivityAt) - Date.parse(left.latestActivityAt));
}

export function buildCandidateOpenWorkSummary(rows: CandidateWorkspaceItem[]): CandidateOpenWorkSummary {
  return rows.reduce<CandidateOpenWorkSummary>(
    (summary, row) => {
      summary.total += 1;
      if (row.openWorkBucket === "needs_resume") summary.needsResume += 1;
      if (row.openWorkBucket === "test_not_sent") summary.testNotSent += 1;
      if (row.openWorkBucket === "in_progress") summary.inProgress += 1;
      if (row.openWorkBucket === "ready_for_review") summary.readyForReview += 1;
      if (row.openWorkBucket === "moved_forward") summary.movedForward += 1;
      if (row.openWorkBucket === "stalled") summary.stalled += 1;
      return summary;
    },
    {
      total: 0,
      needsResume: 0,
      testNotSent: 0,
      inProgress: 0,
      readyForReview: 0,
      movedForward: 0,
      stalled: 0
    }
  );
}

function noteTitle(note: CandidateNoteRecord) {
  return note.type === "technical" ? "Technical note added" : `${note.type[0].toUpperCase()}${note.type.slice(1)} note added`;
}

export function buildCandidateActivityFeed(candidate: CandidateDetail): CandidateActivityItem[] {
  const items: CandidateActivityItem[] = [
    {
      id: `${candidate.id}-candidate`,
      at: candidate.updatedAt,
      kind: "candidate",
      title: "Candidate updated",
      detail: candidate.currentFocus || candidate.positionAppliedFor || candidate.email
    }
  ];

  for (const resume of candidate.resumes) {
    items.push({
      id: resume.id,
      at: resume.uploadedAt,
      kind: "resume",
      title: "Resume uploaded",
      detail: resume.fileName
    });
  }

  for (const note of candidate.notes) {
    items.push({
      id: note.id,
      at: note.createdAt,
      kind: "note",
      title: noteTitle(note),
      detail: note.body
    });
  }

  for (const assessment of candidate.assessments) {
    items.push({
      id: assessment.id,
      at: assessment.createdAt,
      kind: "assessment",
      title: "Assessment linked",
      detail: assessment.inviteSlug ? `Invite ${assessment.inviteSlug.toUpperCase()}` : "Assessment created"
    });

    if (assessment.submittedAt && typeof assessment.finalPercent === "number") {
      items.push({
        id: `${assessment.id}-result`,
        at: assessment.submittedAt,
        kind: "result",
        title: "Result available",
        detail: `${assessment.finalPercent.toFixed(1)} / 100`
      });
    }
  }

  for (const milestone of candidate.milestones) {
    if (milestone.status === "not_started" && !milestone.notes && !milestone.assessment) continue;
    items.push({
      id: `${milestone.id}-milestone`,
      at: milestone.updatedAt,
      kind: "milestone",
      title: milestone.title,
      detail: milestone.notes || milestone.assessment?.status || milestone.status
    });
  }

  return items.sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
}
