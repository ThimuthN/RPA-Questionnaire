import { prisma } from "@/lib/db/prisma";
import type {
  CandidateAssessmentStatus,
  CandidateNextAction,
  CandidateNoteType,
  CandidateScreeningStatus,
  CandidateStage
} from "@/lib/candidates/types";
import type {
  CheckType,
  CandidateMilestoneMode,
  CandidateMilestoneResult,
  CandidateMilestoneStatus,
  CandidateMilestoneType
} from "@/lib/candidates/milestones";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
import type {
  CandidateApplicationRecord,
  CandidateAssessmentRecord,
  CandidateMilestoneRecord,
  CandidateNoteRecord,
  CandidateRecord,
  CandidateResumeRecord
} from "./types";

export function mapCandidate(row: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roleId: string | null;
  departmentId?: string | null;
  hrOwnerId?: string | null;
  role: { label: string; department: string | null } | null;
  department?: { id: string; name: string } | null;
  positionAppliedFor: string | null;
  batchId: string | null;
  resumeSource: string | null;
  hrOwner: string | null;
  stage: string;
  nextAction: string;
  screeningStatus: string | null;
  candidateFolderUrl: string | null;
  notesSummary: string | null;
  orgStatus?: string | null;
  orgStage?: string | null;
  finalizedAs?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CandidateRecord {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone ?? undefined,
    roleId: row.roleId ?? undefined,
    roleLabel: row.role?.label ?? row.positionAppliedFor ?? undefined,
    roleDepartment: row.role?.department ?? undefined,
    departmentId: row.departmentId ?? undefined,
    departmentName: row.department?.name ?? undefined,
    positionAppliedFor: row.positionAppliedFor ?? row.role?.label ?? undefined,
    batchId: row.batchId ?? undefined,
    resumeSource: row.resumeSource ?? undefined,
    hrOwner: row.hrOwner ?? undefined,
    hrOwnerId: row.hrOwnerId ?? undefined,
    stage: row.stage as CandidateStage,
    nextAction: row.nextAction as CandidateNextAction,
    screeningStatus: (row.screeningStatus as CandidateScreeningStatus | null) ?? undefined,
    orgStatus: (row.orgStatus as "active" | "talent_pool" | "org_rejected" | null) ?? undefined,
    orgStage: (row.orgStage as "active" | "finalized" | null) ?? undefined,
    finalizedAs: (row.finalizedAs as "hired" | "rejected" | null) ?? undefined,
    candidateFolderUrl: row.candidateFolderUrl ?? undefined,
    notesSummary: row.notesSummary ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function mapApplication(row: {
  id: string;
  candidateId: string;
  jobPostingId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  jobPosting: {
    slug: string;
    title: string;
    role: { label: string; department: string | null } | null;
  };
}): CandidateApplicationRecord {
  return {
    id: row.id,
    candidateId: row.candidateId,
    jobPostingId: row.jobPostingId,
    jobSlug: row.jobPosting.slug,
    jobTitle: row.jobPosting.title,
    roleLabel: row.jobPosting.role?.label ?? undefined,
    roleDepartment: row.jobPosting.role?.department ?? undefined,
    status: row.status as CandidateApplicationStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function mapResume(row: {
  id: string;
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
  uploadedAt: Date;
}): CandidateResumeRecord {
  return {
    id: row.id,
    candidateId: row.candidateId,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    storageKey: row.storageKey,
    storageUrl: row.storageUrl,
    uploadedAt: row.uploadedAt.toISOString()
  };
}

export function mapNote(
  row: {
    id: string;
    candidateId: string;
    type: string;
    body: string;
    createdAt: Date;
    deletedAt?: Date | null;
    createdById: string | null;
  },
  author?: { name: string | null; email: string } | null
): CandidateNoteRecord {
  return {
    id: row.id,
    candidateId: row.candidateId,
    type: row.type as CandidateNoteType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString(),
    createdById: row.createdById ?? undefined,
    createdByName: author?.name ?? undefined,
    createdByEmail: author?.email ?? undefined
  };
}

function deriveAssessmentStatus(args: {
  attemptStatus?: string | null;
  hasResult: boolean;
  pass?: boolean | null;
  borderline?: boolean | null;
}): CandidateAssessmentStatus {
  if (!args.attemptStatus) {
    return "invited";
  }
  if (args.attemptStatus === "in_progress") {
    return "in_progress";
  }
  if (args.hasResult && args.pass) {
    return "passed";
  }
  if (args.hasResult && args.borderline) {
    return "review";
  }
  if (args.hasResult) {
    return "failed";
  }
  return "invited";
}

export function mapAssessment(
  row: {
    id: string;
    inviteId: string;
    attemptId: string | null;
    createdAt: Date;
    createdById: string | null;
    invite: { slug: string; mode?: string | null };
    attempt: { status: string; startedAt: Date; submittedAt: Date | null } | null;
  },
  result?: {
    finalPercent: number;
    pass: boolean;
    borderline: boolean;
  } | null
): CandidateAssessmentRecord {
  return {
    id: row.id,
    inviteId: row.inviteId,
    inviteSlug: row.invite.slug,
    entryUrl: `/a/${row.invite.slug}`,
    attemptId: row.attemptId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    createdById: row.createdById ?? undefined,
    status: deriveAssessmentStatus({
      attemptStatus: row.attempt?.status,
      hasResult: Boolean(result),
      pass: result?.pass,
      borderline: result?.borderline
    }),
    startedAt: row.attempt?.startedAt.toISOString(),
    submittedAt: row.attempt?.submittedAt?.toISOString(),
    finalPercent: result?.finalPercent,
    pass: result?.pass,
    borderline: result?.borderline
  };
}

function candidateAssessmentActivityAt(assessment: CandidateAssessmentRecord) {
  return Date.parse(assessment.submittedAt ?? assessment.startedAt ?? assessment.createdAt);
}

export function sortCandidateAssessmentsByLatestActivity<T extends CandidateAssessmentRecord>(assessments: T[]) {
  return [...assessments].sort((left, right) => candidateAssessmentActivityAt(right) - candidateAssessmentActivityAt(left));
}

export function mapMilestone(
  row: {
    id: string;
    candidateId: string;
    type: string;
    title: string;
    status: string;
    sortOrder: number;
    mode: string;
    date: Date | null;
    notes: string | null;
    score: number | null;
    result: string | null;
    recommendation: string | null;
    candidateAssessmentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    checks?: Array<{
      id: string;
      type: string;
      status: string;
      notes: string | null;
      actorId: string | null;
      actorName: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  },
  assessment?: CandidateAssessmentRecord | null
): CandidateMilestoneRecord {
  return {
    id: row.id,
    candidateId: row.candidateId,
    type: row.type as CandidateMilestoneType,
    title: row.title,
    status: row.status as CandidateMilestoneStatus,
    sortOrder: row.sortOrder,
    mode: row.mode as CandidateMilestoneMode,
    date: row.date?.toISOString(),
    notes: row.notes ?? undefined,
    score: typeof row.score === "number" ? row.score : undefined,
    result: (row.result as CandidateMilestoneResult | null) ?? undefined,
    recommendation: row.recommendation ?? undefined,
    candidateAssessmentId: row.candidateAssessmentId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    assessment: assessment ?? null,
    checks: row.checks?.map((check) => ({
      id: check.id,
      type: check.type as CheckType,
      status: check.status,
      notes: check.notes ?? undefined,
      actorId: check.actorId ?? undefined,
      actorName: check.actorName ?? undefined,
      createdAt: check.createdAt.toISOString(),
      updatedAt: check.updatedAt.toISOString()
    }))
  };
}

export function currentFocusFromMilestones(milestones: CandidateMilestoneRecord[]) {
  const active = milestones.find((milestone) => milestone.status === "in_progress");
  if (active) {
    return active.title;
  }

  const pending = milestones.find((milestone) => milestone.status === "not_started");
  return pending?.title;
}

export async function loadResultsByAttemptId(attemptIds: string[]) {
  if (attemptIds.length === 0) {
    return new Map<string, { finalPercent: number; pass: boolean; borderline: boolean }>();
  }

  const rows = await prisma.result.findMany({
    where: {
      attemptId: {
        in: attemptIds
      }
    },
    select: {
      attemptId: true,
      finalPercent: true,
      pass: true,
      borderline: true
    }
  });

  return new Map(
    rows.map((row) => [
      row.attemptId,
      {
        finalPercent: row.finalPercent,
        pass: row.pass,
        borderline: row.borderline
      }
    ])
  );
}

export async function loadUsersById(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { name: string | null; email: string }>();
  }

  const rows = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  return new Map(rows.map((row) => [row.id, { name: row.name, email: row.email }]));
}
