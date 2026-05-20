import type {
  CandidateAssessmentStatus,
  CandidateNextAction
} from "@/lib/candidates/types";
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
  latestAssessmentStatus: CandidateAssessmentStatus;
  latestActivityAt: string;
  staleDays: number;
  openWorkBucket: CandidateOpenWorkBucket;
}

export interface CandidateActivityItem {
  id: string;
  at: string;
  kind: "candidate" | "resume" | "note" | "assessment" | "result" | "milestone" | "application" | "activity";
  title: string;
  detail: string;
  actorName?: string | null;
  isSystemEvent?: boolean;
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
  let latestAt = candidate.updatedAt;
  let latestTime = Date.parse(latestAt);

  for (const date of [
    candidate.latestAssessment?.submittedAt,
    candidate.latestAssessment?.startedAt,
    candidate.latestAssessment?.createdAt
  ]) {
    if (!date) continue;

    const parsed = Date.parse(date);
    if (parsed > latestTime) {
      latestAt = date;
      latestTime = parsed;
    }
  }

  return latestAt;
}

function openWorkBucket(args: {
  hasResume: boolean;
  stage: string;
  staleDays: number;
  assessmentStatus: CandidateAssessmentStatus;
  nextAction: CandidateNextAction;
}) {
  if (!args.hasResume) return "needs_resume" as const;
  if (args.assessmentStatus === "none") return "test_not_sent" as const;
  if (
    args.assessmentStatus === "passed" ||
    args.assessmentStatus === "review" ||
    args.assessmentStatus === "failed" ||
    args.nextAction === "review_result"
  ) {
    return "ready_for_review" as const;
  }
  if (args.staleDays >= 7 && args.stage !== "finalized" && args.stage !== "finalized") {
    return "stalled" as const;
  }
  if (args.stage === "finalized") return "moved_forward" as const;
  return "in_progress" as const;
}

export function toCandidateWorkspaceItem(candidate: CandidateListItem): CandidateWorkspaceItem {
  const assessmentStatus = latestAssessmentStatus(candidate);
  const activityAt = latestActivityAt(candidate);
  const staleDays = daysSince(activityAt);

  return {
    ...candidate,
    latestAssessmentStatus: assessmentStatus,
    latestActivityAt: activityAt,
    staleDays,
    openWorkBucket: openWorkBucket({
      hasResume: candidate.hasResume,
      stage: candidate.stage,
      staleDays,
      assessmentStatus,
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

function eventTitle(eventName: string): string {
  const titles: Record<string, string> = {
    "check_updated": "Check updated",
    "check_created": "Check created",
    "milestone_updated": "Milestone updated",
    "milestone_status_changed": "Status changed",
    "candidate_profile_updated": "Profile updated",
    "assessment_linked": "Assessment linked",
    "resume_uploaded": "Resume uploaded",
    "candidate_updated": "Candidate updated",
    "note_updated": "Note edited",
    "note_deleted": "Note deleted"
  };
  return titles[eventName] ?? eventName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function buildCandidateActivityFeed(candidate: CandidateDetail): CandidateActivityItem[] {
  const items: CandidateActivityItem[] = [
    {
      id: `${candidate.id}-candidate`,
      at: candidate.updatedAt,
      kind: "candidate",
      title: "Candidate updated",
      detail: candidate.currentFocus || candidate.positionAppliedFor || candidate.email,
      isSystemEvent: true
    }
  ];

  for (const resume of candidate.resumes) {
    items.push({
      id: resume.id,
      at: resume.uploadedAt,
      kind: "resume",
      title: "Resume uploaded",
      detail: resume.fileName,
      isSystemEvent: true
    });
  }

  for (const note of candidate.notes) {
    items.push({
      id: note.id,
      at: note.createdAt,
      kind: "note",
      title: note.deletedAt ? `${noteTitle(note)} (deleted)` : noteTitle(note),
      detail: note.body,
      actorName: note.createdByName || null
    });
  }

  for (const assessment of candidate.assessments) {
    items.push({
      id: assessment.id,
      at: assessment.createdAt,
      kind: "assessment",
      title: "Assessment linked",
      detail: assessment.inviteSlug ? `Invite ${assessment.inviteSlug.toUpperCase()}` : "Assessment created",
      isSystemEvent: true
    });

    if (assessment.submittedAt && typeof assessment.finalPercent === "number") {
      items.push({
        id: `${assessment.id}-result`,
        at: assessment.submittedAt,
        kind: "result",
        title: "Result available",
        detail: `${assessment.finalPercent.toFixed(1)} / 100`,
        isSystemEvent: true
      });
    }
  }

  for (const application of candidate.applications) {
    items.push({
      id: `${application.id}-application`,
      at: application.createdAt,
      kind: "application",
      title: "Application received",
      detail: application.jobTitle,
      isSystemEvent: true
    });
  }

  for (const milestone of candidate.milestones) {
    if (milestone.status === "not_started" && !milestone.notes && !milestone.assessment) continue;
    const latestCheck = milestone.checks?.[milestone.checks.length - 1];
    items.push({
      id: `${milestone.id}-milestone`,
      at: milestone.updatedAt,
      kind: "milestone",
      title: milestone.title,
      detail: milestone.notes || milestone.assessment?.status || milestone.status,
      actorName: latestCheck?.actorName || null
    });
  }

  for (const event of candidate.activityEvents) {
    items.push({
      id: event.id,
      at: event.createdAt,
      kind: "activity",
      title: eventTitle(event.event),
      detail: event.detail || "Activity logged",
      actorName: event.actorName || null,
      isSystemEvent: !event.actorName
    });
  }

  return items.sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
}
