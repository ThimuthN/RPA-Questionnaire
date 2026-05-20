import { del } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  defaultCandidateMilestones,
  deriveMilestoneStatus,
  milestoneCheckDefs,
  type CheckType,
  type CandidateMilestoneMode,
  type CandidateMilestoneResult,
  type CandidateMilestoneStatus,
  type CandidateMilestoneType
} from "@/lib/candidates/milestones";
import type {
  CandidateListSort,
  CandidateOpenWorkSummary,
  CandidateWorkspaceItem
} from "@/lib/candidates/workspace";
import {
  buildCandidateOpenWorkSummary,
  sortCandidateWorkspaceItems,
  toCandidateWorkspaceItem
} from "@/lib/candidates/workspace";
import { listRoleCatalog, resolveOrCreateRoleCatalogEntry } from "@/lib/roles/catalog";
import type {
  CandidateAssessmentStatus,
  CandidateNextAction,
  CandidateNoteType,
  CandidateScreeningStatus,
  CandidateStage
} from "@/lib/candidates/types";
import { linkCandidateAssessmentAttemptInTx } from "@/lib/db/candidate-assessment-links";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
import { cuidLike } from "@/lib/tokens/token-service";
import { logError } from "@/lib/server/logger";


export interface CandidateRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId?: string;
  roleLabel?: string;
  roleDepartment?: string;
  departmentId?: string;
  departmentName?: string;
  positionAppliedFor?: string;
  batchId?: string;
  resumeSource?: string;
  hrOwner?: string;
  hrOwnerId?: string;
  stage: CandidateStage;
  nextAction: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
  orgStatus?: "active" | "talent_pool" | "org_rejected";
  orgStage?: "active" | "finalized";
  finalizedAs?: "hired" | "rejected";
  candidateFolderUrl?: string;
  notesSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateResumeRecord {
  id: string;
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
  uploadedAt: string;
}

export interface CandidateNoteRecord {
  id: string;
  candidateId: string;
  type: CandidateNoteType;
  body: string;
  createdAt: string;
  deletedAt?: string;
  createdById?: string;
  createdByName?: string;
  createdByEmail?: string;
}

export interface CandidateAssessmentRecord {
  id: string;
  inviteId: string;
  inviteSlug: string;
  entryUrl?: string;
  attemptId?: string;
  createdAt: string;
  createdById?: string;
  status: CandidateAssessmentStatus;
  startedAt?: string;
  submittedAt?: string;
  finalPercent?: number;
  pass?: boolean;
  borderline?: boolean;
}

export interface CandidateApplicationRecord {
  id: string;
  candidateId: string;
  jobPostingId: string;
  jobSlug: string;
  jobTitle: string;
  roleLabel?: string;
  roleDepartment?: string;
  status: CandidateApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateMilestoneCheckRecord {
  id: string;
  type: CheckType;
  status: string;
  notes?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateMilestoneRecord {
  id: string;
  candidateId: string;
  type: CandidateMilestoneType;
  title: string;
  status: CandidateMilestoneStatus;
  sortOrder: number;
  mode: CandidateMilestoneMode;
  date?: string;
  notes?: string;
  score?: number;
  result?: CandidateMilestoneResult;
  recommendation?: string;
  candidateAssessmentId?: string;
  createdAt: string;
  updatedAt: string;
  assessment?: CandidateAssessmentRecord | null;
  checks?: CandidateMilestoneCheckRecord[];
}

export interface CandidateListItem extends CandidateRecord {
  hasResume: boolean;
  latestResumeStorageKey?: string;
  currentFocus?: string;
  latestAssessment: CandidateAssessmentRecord | null;
}

export interface CandidateActivityEventRecord {
  id: string;
  actorId?: string;
  actorName?: string;
  event: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
  createdAt: string;
}

export interface DepartmentCandidacyDetail {
  id: string;
  candidateId: string;
  departmentId: string;
  roleId?: string;
  hrOwnerId?: string;
  status: "active" | "talent_pool" | "dept_rejected" | "transferred_out";
  source: "manual" | "job_application" | "nominated";
  nominatedBy?: string;
  nominationNote?: string;
  jobPostingId?: string;
  department: {
    id: string;
    name: string;
  };
  role?: {
    id: string;
    label: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CandidateDetail extends CandidateRecord {
  resumes: CandidateResumeRecord[];
  notes: CandidateNoteRecord[];
  assessments: CandidateAssessmentRecord[];
  applications: CandidateApplicationRecord[];
  milestones: CandidateMilestoneRecord[];
  departmentCandidacies?: DepartmentCandidacyDetail[];
  activityEvents: CandidateActivityEventRecord[];
  currentFocus?: string;
}

export interface CandidateWorkspaceFilters {
  q?: string;
  roleId?: string;
  jobId?: string;
  stage?: CandidateStage;
  stageValues?: string[];
  departmentId?: string;
  orgStage?: "active" | "finalized";
  finalizedAs?: "hired" | "rejected";
  owner?: string;
  assessmentStatus?: CandidateAssessmentStatus;
  sort?: CandidateListSort;
  page?: number;
  pageSize?: number;
}

export interface CandidateWorkspacePage {
  rows: CandidateWorkspaceItem[];
  total: number;
  page: number;
  pageSize: number;
  roleOptions: Array<{ id: string; label: string; departmentId?: string }>;
  ownerOptions: Array<{ id: string; label: string }>;
  summary: CandidateOpenWorkSummary;
}

async function findCandidateByEmail(email: string) {
  return prisma.candidate.findFirst({
    where: {
      email: email.trim().toLowerCase()
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });
}

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
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // Allow additional properties for Prisma type inference
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
    orgStatus: row.orgStatus ?? undefined,
    orgStage: (row.orgStage as "active" | "finalized" | null) ?? undefined,
    finalizedAs: (row.finalizedAs as "hired" | "rejected" | null) ?? undefined,
    candidateFolderUrl: row.candidateFolderUrl ?? undefined,
    notesSummary: row.notesSummary ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapApplication(row: {
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

function mapResume(row: {
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

function mapNote(row: {
  id: string;
  candidateId: string;
  type: string;
  body: string;
  createdAt: Date;
  deletedAt?: Date | null;
  createdById: string | null;
}, author?: { name: string | null; email: string } | null): CandidateNoteRecord {
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

function mapAssessment(
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

function sortCandidateAssessmentsByLatestActivity<T extends CandidateAssessmentRecord>(assessments: T[]) {
  return [...assessments].sort((left, right) => candidateAssessmentActivityAt(right) - candidateAssessmentActivityAt(left));
}

function mapMilestone(
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

function currentFocusFromMilestones(milestones: CandidateMilestoneRecord[]) {
  const active = milestones.find((milestone) => milestone.status === "in_progress");
  if (active) {
    return active.title;
  }

  const pending = milestones.find((milestone) => milestone.status === "not_started");
  return pending?.title;
}

async function loadResultsByAttemptId(attemptIds: string[]) {
  if (attemptIds.length === 0) {
    return new Map<
      string,
      { finalPercent: number; pass: boolean; borderline: boolean }
    >();
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

async function loadUsersById(userIds: string[]) {
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

export async function createCandidate(input: {
  fullName: string;
  email: string;
  phone?: string;
  roleId?: string;
  departmentId?: string;
  hrOwnerId?: string;
  positionAppliedFor?: string;
  batchId?: string;
  resumeSource?: string;
  hrOwner?: string;
  stage?: CandidateStage;
  nextAction?: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
  candidateFolderUrl?: string;
  notesSummary?: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingByEmail = await findCandidateByEmail(normalizedEmail);
  if (existingByEmail) {
    throw new Error(`A candidate with ${normalizedEmail} already exists.`);
  }

  const resolvedRole = await resolveOrCreateRoleCatalogEntry({
    roleId: input.roleId,
    legacyRoleLabel: input.positionAppliedFor,
    createIfMissing: Boolean(input.positionAppliedFor?.trim())
  });

  const created = await prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.create({
      data: {
        id: cuidLike(),
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: input.phone?.trim() || null,
        roleId: resolvedRole?.id ?? null,
        departmentId: input.departmentId || null,
        hrOwnerId: input.hrOwnerId || null,
        positionAppliedFor: input.roleId ? null : (resolvedRole?.label ?? (input.positionAppliedFor?.trim() || null)),
        batchId: input.batchId?.trim() || null,
        resumeSource: input.resumeSource?.trim() || null,
        hrOwner: input.hrOwner?.trim() || null,
        stage: input.stage ?? "applicant",
        nextAction: input.nextAction ?? "none",
        screeningStatus: input.screeningStatus ?? null,
        candidateFolderUrl: input.candidateFolderUrl?.trim() || null,
        notesSummary: input.notesSummary?.trim() || null
      },
      include: {
        role: {
          select: {
            label: true,
            department: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    await tx.candidateMilestone.createMany({
      data: defaultCandidateMilestones().map((milestone) => ({
        id: cuidLike(),
        candidateId: candidate.id,
        type: milestone.type,
        title: milestone.title,
        status: milestone.status,
        sortOrder: milestone.sortOrder,
        mode: milestone.mode
      }))
    });

    if (candidate.departmentId) {
      await tx.departmentCandidacy.upsert({
        where: {
          candidateId_departmentId: {
            candidateId: candidate.id,
            departmentId: candidate.departmentId
          }
        },
        update: {
          roleId: candidate.roleId,
          status: "active",
          updatedAt: new Date()
        },
        create: {
          id: cuidLike(),
          candidateId: candidate.id,
          departmentId: candidate.departmentId,
          roleId: candidate.roleId,
          status: "active",
          source: "manual"
        }
      });
    }

    return candidate;
  });

  return mapCandidate(created);
}

export async function createCandidatesBatch(
  inputs: Array<{
    fullName: string;
    email: string;
    phone?: string;
    roleId?: string;
    positionAppliedFor?: string;
    batchId?: string;
    resumeSource?: string;
    hrOwner?: string;
    stage?: CandidateStage;
    nextAction?: CandidateNextAction;
    screeningStatus?: CandidateScreeningStatus;
    candidateFolderUrl?: string;
    notesSummary?: string;
  }>
) {
  const normalizedInputs = inputs.map((input) => ({
    ...input,
    email: input.email.trim().toLowerCase()
  }));

  const uniqueRoleLabels = [
    ...new Set(
      normalizedInputs
        .map((i) => i.positionAppliedFor?.trim())
        .filter((label): label is string => Boolean(label))
    )
  ];
  const rolesByLabel = new Map<string, { id: string; label: string }>();
  if (uniqueRoleLabels.length > 0) {
    const rolesFromDb = await prisma.roleCatalog.findMany({
      where: { label: { in: uniqueRoleLabels } },
      select: { id: true, label: true }
    });
    rolesFromDb.forEach((role) => rolesByLabel.set(role.label, role));
  }

  let createdCount = 0;
  const baselineMilestones = defaultCandidateMilestones();

  // Prepare all candidate data and milestone data in advance for batch creation
  const candidateCreates: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    roleId: string | null;
    positionAppliedFor: string | null;
    batchId: string | null;
    resumeSource: string | null;
    hrOwner: string | null;
    stage: string;
    nextAction: string;
    screeningStatus: string | null;
    candidateFolderUrl: string | null;
    notesSummary: string | null;
  }> = [];
  const milestoneCreates: Array<{
    id: string;
    candidateId: string;
    type: CandidateMilestoneType;
    title: string;
    status: CandidateMilestoneStatus;
    sortOrder: number;
    mode: CandidateMilestoneMode;
  }> = [];

  for (const input of normalizedInputs) {
    const role = input.positionAppliedFor?.trim()
      ? rolesByLabel.get(input.positionAppliedFor.trim())
      : null;

    const candidateId = cuidLike();

    candidateCreates.push({
      id: candidateId,
      fullName: input.fullName.trim(),
      email: input.email,
      phone: input.phone?.trim() || null,
      roleId: input.roleId ?? role?.id ?? null,
      positionAppliedFor: input.roleId
        ? null
        : role?.label ?? (input.positionAppliedFor?.trim() || null),
      batchId: input.batchId?.trim() || null,
      resumeSource: input.resumeSource?.trim() || null,
      hrOwner: input.hrOwner?.trim() || null,
      stage: input.stage ?? "applicant",
      nextAction: input.nextAction ?? "none",
      screeningStatus: input.screeningStatus ?? null,
      candidateFolderUrl: input.candidateFolderUrl?.trim() || null,
      notesSummary: input.notesSummary?.trim() || null
    });

    baselineMilestones.forEach((milestone) => {
      milestoneCreates.push({
        id: cuidLike(),
        candidateId,
        type: milestone.type,
        title: milestone.title,
        status: milestone.status,
        sortOrder: milestone.sortOrder,
        mode: milestone.mode
      });
    });

    createdCount += 1;
  }

  // Execute all creates in a single transaction instead of N sequential transactions
  await prisma.$transaction(async (tx) => {
    await tx.candidate.createMany({ data: candidateCreates });
    await tx.candidateMilestone.createMany({ data: milestoneCreates });
  });

  return { createdCount };
}

export async function updateCandidate(
  candidateId: string,
  input: {
    fullName: string;
    email: string;
    phone?: string;
    roleId?: string;
    positionAppliedFor?: string;
    batchId?: string;
    resumeSource?: string;
    hrOwner?: string;
    departmentId?: string;
    hrOwnerId?: string;
    stage: CandidateStage;
    nextAction: CandidateNextAction;
    screeningStatus?: CandidateScreeningStatus;
    candidateFolderUrl?: string;
    notesSummary?: string;
    actorId?: string;
    actorName?: string;
  }
) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingByEmail = await findCandidateByEmail(normalizedEmail);
  if (existingByEmail && existingByEmail.id !== candidateId) {
    throw new Error(`A candidate with ${normalizedEmail} already exists.`);
  }

  const resolvedRole = await resolveOrCreateRoleCatalogEntry({
    roleId: input.roleId,
    legacyRoleLabel: input.positionAppliedFor,
    createIfMissing: Boolean(input.positionAppliedFor?.trim())
  });

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.candidate.findUnique({
      where: { id: candidateId },
      select: {
        fullName: true,
        email: true,
        phone: true,
        roleId: true,
        positionAppliedFor: true,
        departmentId: true,
        stage: true,
        nextAction: true,
        hrOwner: true,
        screeningStatus: true
      }
    });

    const upd = await tx.candidate.update({
      where: { id: candidateId },
      data: {
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: input.phone?.trim() || null,
        roleId: input.roleId !== undefined ? resolvedRole?.id ?? null : current?.roleId,
        positionAppliedFor: input.roleId !== undefined
          ? null
          : input.positionAppliedFor !== undefined
            ? resolvedRole?.label ?? (input.positionAppliedFor?.trim() || null)
            : current?.positionAppliedFor,
        batchId: input.batchId?.trim() || null,
        resumeSource: input.resumeSource?.trim() || null,
        hrOwner: input.hrOwner?.trim() || null,
        departmentId: input.departmentId !== undefined ? input.departmentId || null : current?.departmentId,
        hrOwnerId: input.hrOwnerId || null,
        stage: input.stage,
        nextAction: input.nextAction,
        screeningStatus: input.screeningStatus ?? null,
        candidateFolderUrl: input.candidateFolderUrl?.trim() || null,
        notesSummary: input.notesSummary?.trim() || null
      },
      include: {
        role: {
          select: {
            label: true,
            department: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const changedFields: string[] = [];
    if (current && current.fullName !== input.fullName.trim()) changedFields.push("name");
    if (current && current.email !== normalizedEmail) changedFields.push("email");
    if (current && current.phone !== (input.phone?.trim() || null)) changedFields.push("phone");
    if (input.roleId !== undefined && current && current.roleId !== (resolvedRole?.id ?? null)) changedFields.push("role");
    if (input.departmentId !== undefined && current && current.departmentId !== (input.departmentId || null)) changedFields.push("department");
    if (current && current.stage !== input.stage) changedFields.push("stage");
    if (current && current.nextAction !== input.nextAction) changedFields.push("nextAction");
    if (current && current.hrOwner !== (input.hrOwner?.trim() || null)) changedFields.push("owner");
    if (current && current.screeningStatus !== (input.screeningStatus ?? null)) changedFields.push("screeningStatus");

    if (changedFields.length > 0) {
      await logActivityEvent(tx, {
        candidateId,
        event: "candidate_profile_updated",
        detail: `Updated: ${changedFields.join(", ")}`,
        actorId: input.actorId,
        actorName: input.actorName
      });
    }

    return upd;
  });

  return mapCandidate(updated);
}

export async function deleteCandidate(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      resumes: {
        select: {
          storageKey: true
        }
      },
      assessments: {
        select: {
          inviteId: true,
          attemptId: true,
          attemptHistory: {
            select: {
              attemptId: true
            }
          }
        }
      }
    }
  });

  if (!candidate) {
    throw new Error("Candidate not found.");
  }

  const attemptIds = [
    ...new Set(
      candidate.assessments.flatMap((assessment) => [
        ...(assessment.attemptId ? [assessment.attemptId] : []),
        ...assessment.attemptHistory.map((history) => history.attemptId)
      ])
    )
  ];
  const resumeStorageKeys = [...new Set(candidate.resumes.map((resume) => resume.storageKey).filter(Boolean))];

  await prisma.$transaction(async (tx) => {
    const attempts =
      attemptIds.length > 0
        ? await tx.attempt.findMany({
            where: {
              id: {
                in: attemptIds
              }
            },
            select: {
              id: true,
              participantId: true
            }
          })
        : [];
    const participantIds = [...new Set(attempts.map((attempt) => attempt.participantId))];

    if (attemptIds.length > 0) {
      await tx.result.deleteMany({
        where: {
          attemptId: {
            in: attemptIds
          }
        }
      });

      await tx.attempt.deleteMany({
        where: {
          id: {
            in: attemptIds
          }
        }
      });
    }

    await tx.candidate.delete({
      where: { id: candidateId }
    });

    if (participantIds.length > 0) {
      const usedParticipantIds = await tx.attempt.findMany({
        where: { participantId: { in: participantIds } },
        select: { participantId: true }
      });
      const usedSet = new Set(usedParticipantIds.map((r) => r.participantId));
      const toDelete = participantIds.filter((id) => !usedSet.has(id));
      if (toDelete.length > 0) {
        await tx.participant.deleteMany({ where: { id: { in: toDelete } } });
      }
    }
  });

  if (resumeStorageKeys.length > 0) {
    try {
      await del(resumeStorageKeys);
    } catch (error) {
      logError("candidate.resume_cleanup_failed", {
        candidateId,
        resumeStorageKeys,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}

export async function addCandidateResume(input: {
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
}) {
  const resume = await prisma.$transaction(async (tx) => {
    const stored = await tx.candidateResume.upsert({
      where: {
        candidateId_storageKey: {
          candidateId: input.candidateId,
          storageKey: input.storageKey
        }
      },
      update: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageUrl: input.storageUrl
      },
      create: {
        id: cuidLike(),
        candidateId: input.candidateId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        storageUrl: input.storageUrl
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    return stored;
  });

  return mapResume(resume);
}

export async function getLatestCandidateResume(candidateId: string) {
  const row = await prisma.candidateResume.findFirst({
    where: { candidateId },
    orderBy: { uploadedAt: "desc" }
  });

  return row ? mapResume(row) : null;
}

export async function getCandidateResumeByStorageKey(candidateId: string, storageKey: string) {
  const row = await prisma.candidateResume.findUnique({
    where: {
      candidateId_storageKey: {
        candidateId,
        storageKey
      }
    }
  });

  return row ? mapResume(row) : null;
}

export async function addCandidateNote(input: {
  candidateId: string;
  type: CandidateNoteType;
  body: string;
  createdById?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.candidateNote.create({
      data: {
        id: cuidLike(),
        candidateId: input.candidateId,
        type: input.type,
        body: input.body.trim(),
        createdById: input.createdById ?? null
      },
      select: {
        id: true,
        type: true,
        body: true,
        createdAt: true,
        createdById: true
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    return created;
  });

  return mapNote(result as any);
}

export async function updateCandidateNote(input: {
  noteId: string;
  candidateId: string;
  body: string;
  updatedById?: string;
  updatedByName?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.candidateNote.update({
      where: { id: input.noteId },
      data: {
        body: input.body.trim(),
        updatedById: input.updatedById ?? null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        type: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        createdById: true
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: { updatedAt: new Date() }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: input.candidateId,
        actorId: input.updatedById ?? null,
        actorName: input.updatedByName ?? null,
        event: "note_updated",
        entityType: "note",
        entityId: input.noteId,
        detail: input.body.slice(0, 100),
        createdAt: new Date()
      }
    });

    return updated;
  });

  return mapNote(result as any);
}

export async function deleteCandidateNote(input: {
  noteId: string;
  candidateId: string;
  deletedById?: string;
  deletedByName?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.candidateNote.update({
      where: { id: input.noteId },
      data: {
        deletedAt: new Date()
      },
      select: {
        id: true,
        type: true,
        body: true,
        createdAt: true,
        deletedAt: true,
        createdById: true
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: { updatedAt: new Date() }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: input.candidateId,
        actorId: input.deletedById ?? null,
        actorName: input.deletedByName ?? null,
        event: "note_deleted",
        entityType: "note",
        entityId: input.noteId,
        detail: deleted.body.slice(0, 100),
        createdAt: new Date()
      }
    });

    return deleted;
  });

  return mapNote(result as any);
}

async function logActivityEvent(
  tx: any,
  input: {
    candidateId: string;
    event: string;
    entityType?: string;
    entityId?: string;
    detail?: string;
    actorId?: string;
    actorName?: string;
  }
) {
  await tx.candidateActivityEvent.create({
    data: {
      id: cuidLike(),
      candidateId: input.candidateId,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      event: input.event,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      detail: input.detail ?? null,
      createdAt: new Date()
    }
  });
}

export async function bulkUpdateCandidates(input: {
  candidateIds: string[];
  action: "assign_owner" | "set_stage" | "add_note" | "set_department" | "nominate_to_dept" | "set_org_status";
  owner?: string;
  stage?: CandidateStage;
  roleId?: string;
  departmentId?: string;
  hrOwnerId?: string;
  noteBody?: string;
  noteType?: CandidateNoteType;
  nominationNote?: string;
  orgStatus?: string;
  createdById?: string;
}) {
  const candidateIds = [...new Set(input.candidateIds.filter(Boolean))];
  if (candidateIds.length === 0) {
    throw new Error("Select at least one candidate.");
  }

  if (input.action === "assign_owner") {
    const updateData: any = { updatedAt: new Date() };

    // Prefer hrOwnerId if provided, otherwise use owner string for backward compatibility
    if (input.hrOwnerId) {
      updateData.hrOwnerId = input.hrOwnerId;
      // Also sync the user's name to hrOwner display field
      const user = await prisma.user.findUnique({
        where: { id: input.hrOwnerId },
        select: { name: true }
      });
      if (user) {
        updateData.hrOwner = user.name;
      }
    } else if (input.owner) {
      updateData.hrOwner = input.owner.trim();
    }

    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: updateData
    });
    return { updatedCount: candidateIds.length };
  }

  if (input.action === "set_stage") {
    if (!input.stage) {
      throw new Error("Choose a stage.");
    }

    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        stage: input.stage,
        updatedAt: new Date()
      }
    });
    return { updatedCount: candidateIds.length };
  }

  if (input.action === "set_department") {
    if (!input.departmentId) {
      throw new Error("Select a department.");
    }

    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        departmentId: input.departmentId,
        roleId: null, // Clear role when transferring departments
        updatedAt: new Date()
      }
    });
    return { updatedCount: candidateIds.length };
  }

  if (input.action === "nominate_to_dept") {
    if (!input.departmentId) {
      throw new Error("Select a department to nominate to.");
    }

    // Import here to avoid circular dependency
    const { createOrUpdateDepartmentCandidacy } = await import("./candidacies");

    let count = 0;
    for (const candidateId of candidateIds) {
      await createOrUpdateDepartmentCandidacy({
        candidateId,
        departmentId: input.departmentId,
        roleId: input.roleId,
        hrOwnerId: input.hrOwnerId,
        nominatedBy: input.createdById,
        nominationNote: input.nominationNote,
        source: "nominated"
      });
      count++;
    }
    return { updatedCount: count };
  }

  if (input.action === "set_org_status") {
    if (!input.orgStatus) {
      throw new Error("Select an org status.");
    }

    const { setOrgStatus } = await import("./candidacies");

    let count = 0;
    for (const candidateId of candidateIds) {
      await setOrgStatus(candidateId, input.orgStatus as "active" | "talent_pool" | "org_rejected", input.createdById);
      count++;
    }
    return { updatedCount: count };
  }

  const noteBody = input.noteBody?.trim();
  if (!noteBody) {
    throw new Error("Add a note before saving.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.candidateNote.createMany({
      data: candidateIds.map((candidateId) => ({
        id: cuidLike(),
        candidateId,
        type: input.noteType ?? "decision",
        body: noteBody,
        createdById: input.createdById ?? null
      }))
    });

    await tx.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        updatedAt: new Date()
      }
    });
  });

  return { updatedCount: candidateIds.length };
}

async function applyMilestoneCascade(
  candidateId: string,
  savedMilestoneId: string,
  newStatus: CandidateMilestoneStatus,
  tx: Prisma.TransactionClient
) {
  const allMilestones = await tx.candidateMilestone.findMany({
    where: { candidateId },
    select: { id: true, sortOrder: true, status: true },
    orderBy: { sortOrder: "asc" }
  });

  const savedIndex = allMilestones.findIndex((m) => m.id === savedMilestoneId);
  if (savedIndex === -1) return;

  const earlierNotStartedIds = allMilestones
    .slice(0, savedIndex)
    .filter((m) => m.status === "not_started")
    .map((m) => m.id);

  if (earlierNotStartedIds.length > 0) {
    await tx.candidateMilestone.updateMany({
      where: { id: { in: earlierNotStartedIds } },
      data: { status: "skipped" }
    });
  }

  if (newStatus === "done") {
    // Find next milestone, stopping before decision (sortOrder 9999)
    const nextMilestone = allMilestones
      .slice(savedIndex + 1)
      .find((m) => m.status === "not_started" && m.sortOrder < 9999);

    if (nextMilestone) {
      await tx.candidateMilestone.update({
        where: { id: nextMilestone.id },
        data: { status: "in_progress" }
      });
    }
  }
}

export async function updateCandidateMilestone(
  candidateId: string,
  milestoneId: string,
  input: {
    title?: string;
    status?: CandidateMilestoneStatus;
    mode?: CandidateMilestoneMode;
    date?: string;
    notes?: string;
    score?: number;
    result?: CandidateMilestoneResult;
    recommendation?: string;
    actorId?: string;
    actorName?: string;
  }
) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: milestoneId,
      candidateId
    },
    select: { id: true, type: true, title: true, status: true, score: true, result: true }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  let statusToApply = input.status;
  if (milestone.type === "decision" && input.result && ["accept", "decline"].includes(input.result)) {
    statusToApply = "done";
  }

  const updated = await prisma.$transaction(async (tx) => {
    const upd = await tx.candidateMilestone.update({
      where: { id: milestoneId },
      data: {
        title: input.title?.trim(),
        status: statusToApply,
        mode: input.mode,
        date: input.date ? new Date(input.date) : input.date === "" ? null : undefined,
        notes: typeof input.notes === "string" ? input.notes.trim() || null : undefined,
        score: typeof input.score === "number" && Number.isFinite(input.score) ? input.score : input.score === null ? null : undefined,
        result: input.result ?? undefined,
        recommendation:
          typeof input.recommendation === "string" ? input.recommendation.trim() || null : undefined
      }
    });

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    const changedFields: string[] = [];
    if (input.title !== undefined && milestone.title !== input.title?.trim()) changedFields.push("title");
    if (input.status !== undefined && milestone.status !== statusToApply) changedFields.push(`status: ${statusToApply}`);
    if (input.score !== undefined && milestone.score !== input.score) changedFields.push("score");
    if (input.result !== undefined && milestone.result !== input.result) changedFields.push("result");

    if (changedFields.length > 0) {
      await logActivityEvent(tx, {
        candidateId,
        event: "milestone_updated",
        entityType: "milestone",
        entityId: milestoneId,
        detail: `${milestone.title}: ${changedFields.join(", ")}`,
        actorId: input.actorId,
        actorName: input.actorName
      });
    }

    if (statusToApply) {
      await applyMilestoneCascade(candidateId, milestoneId, statusToApply, tx);
    }

    return upd;
  });

  return mapMilestone(updated);
}

export async function quickUpdateCandidateMilestoneStatus(
  candidateId: string,
  milestoneId: string,
  status: CandidateMilestoneStatus,
  actorId?: string,
  actorName?: string
) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: milestoneId,
      candidateId
    },
    select: { id: true, title: true, status: true }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const upd = await tx.candidateMilestone.update({
      where: { id: milestoneId },
      data: {
        status
      }
    });

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    if (milestone.status !== status) {
      await logActivityEvent(tx, {
        candidateId,
        event: "milestone_status_changed",
        entityType: "milestone",
        entityId: milestoneId,
        detail: `${milestone.title}: ${milestone.status} → ${status}`,
        actorId,
        actorName
      });
    }

    await applyMilestoneCascade(candidateId, milestoneId, status, tx);

    return upd;
  });

  return mapMilestone(updated);
}

export async function initOrUpdateMilestoneCheck(
  candidateId: string,
  milestoneId: string,
  checkType: CheckType,
  status: string,
  notes?: string,
  actorId?: string,
  actorName?: string
) {
  const updated = await prisma.$transaction(async (tx) => {
    const milestone = await tx.candidateMilestone.findFirst({
      where: {
        id: milestoneId,
        candidateId
      },
      select: {
        id: true,
        type: true,
        status: true
      }
    });

    if (!milestone) {
      throw new Error("Milestone not found.");
    }

    await tx.candidateMilestoneCheck.upsert({
      where: {
        milestoneId_type: {
          milestoneId,
          type: checkType
        }
      },
      update: {
        status,
        notes: notes?.trim() || null,
        actorId: actorId || null,
        actorName: actorName || null,
        updatedAt: new Date()
      },
      create: {
        id: cuidLike(),
        milestoneId,
        type: checkType,
        status,
        notes: notes?.trim() || null,
        actorId: actorId || null,
        actorName: actorName || null
      }
    });

    const allChecks = await tx.candidateMilestoneCheck.findMany({
      where: { milestoneId },
      select: { type: true, status: true }
    });

    const defs = milestoneCheckDefs[milestone.type as CandidateMilestoneType] ?? [];
    const newStatus = deriveMilestoneStatus(allChecks as Array<{ type?: CheckType; status: string }>, defs);
    const oldStatus = milestone.status;

    let upd = milestone;
    if (newStatus !== oldStatus) {
      upd = await tx.candidateMilestone.update({
        where: { id: milestoneId },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });

      await applyMilestoneCascade(candidateId, milestoneId, newStatus, tx);
    }

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId,
        actorId: actorId || null,
        actorName: actorName || null,
        event: "check_updated",
        entityType: "check",
        detail: `${checkType}: ${status}${notes ? ` - ${notes}` : ""}`,
        createdAt: new Date()
      }
    });

    return upd;
  });

  return updated;
}

export async function linkCandidateAssessmentToMilestone(input: {
  candidateId: string;
  milestoneId: string;
  candidateAssessmentId: string;
  actorId?: string;
}) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: input.milestoneId,
      candidateId: input.candidateId
    },
    select: {
      id: true,
      title: true
    }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.candidateMilestone.updateMany({
      where: {
        candidateId: input.candidateId,
        candidateAssessmentId: input.candidateAssessmentId,
        NOT: {
          id: input.milestoneId
        }
      },
      data: {
        candidateAssessmentId: null
      }
    });

    await tx.candidateMilestone.update({
      where: { id: input.milestoneId },
      data: {
        candidateAssessmentId: input.candidateAssessmentId,
        status: "in_progress",
        mode: "platform"
      }
    });

    await tx.candidateMilestoneCheck.upsert({
      where: {
        milestoneId_type: {
          milestoneId: input.milestoneId,
          type: "screener_test"
        }
      },
      update: {
        status: "in_progress",
        updatedAt: new Date()
      },
      create: {
        id: `check_${Date.now()}`,
        milestoneId: input.milestoneId,
        type: "screener_test",
        status: "in_progress",
        updatedAt: new Date()
      }
    });

    await logActivityEvent(tx, {
      candidateId: input.candidateId,
      event: "assessment_linked",
      entityType: "milestone",
      entityId: input.milestoneId,
      detail: `Assessment linked to ${milestone.title}`,
      actorId: input.actorId
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    await applyMilestoneCascade(input.candidateId, input.milestoneId, "in_progress", tx);
  });
}

export async function attachExistingAssessmentToMilestone(input: {
  candidateId: string;
  milestoneId: string;
  attemptId?: string;
  inviteSlug?: string;
  createdById?: string;
}) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: input.milestoneId,
      candidateId: input.candidateId
    }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  const inviteSlug = input.inviteSlug?.trim().toLowerCase();
  const attemptId = input.attemptId?.trim();
  if (!inviteSlug && !attemptId) {
    throw new Error("Enter an attempt ID or invite slug.");
  }

  const resolved = attemptId
    ? await prisma.attempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          inviteId: true
        }
      })
    : null;
  const inviteIdFromAttempt = resolved?.inviteId ?? null;
  const invite = inviteSlug
    ? await prisma.invite.findUnique({
        where: { slug: inviteSlug },
        select: { id: true }
      })
    : inviteIdFromAttempt
      ? await prisma.invite.findUnique({
          where: { id: inviteIdFromAttempt },
          select: { id: true }
        })
      : null;

  if (!invite?.id) {
    throw new Error("Screener not found.");
  }

  const existing = await prisma.candidateAssessment.findFirst({
    where: {
      OR: [
        { inviteId: invite.id },
        ...(resolved?.id
          ? [
              { attemptId: resolved.id },
              {
                attemptHistory: {
                  some: {
                    attemptId: resolved.id
                  }
                }
              }
            ]
          : [])
      ]
    }
  });

  let candidateAssessmentId: string;

  if (existing) {
    if (existing.candidateId !== input.candidateId) {
      throw new Error("That screener is already linked to another candidate.");
    }

    candidateAssessmentId = existing.id;
  } else {
    candidateAssessmentId = (
      await prisma.candidateAssessment.create({
        data: {
          id: cuidLike(),
          candidateId: input.candidateId,
          inviteId: invite.id,
          attemptId: resolved?.id ?? null,
          createdById: input.createdById ?? null
        }
      })
    ).id;
  }

  if (resolved?.id) {
    await prisma.$transaction(async (tx) => {
      await linkCandidateAssessmentAttemptInTx({
        tx,
        candidateAssessmentId,
        attemptId: resolved.id
      });
    });
  }

  await linkCandidateAssessmentToMilestone({
    candidateId: input.candidateId,
    milestoneId: input.milestoneId,
    candidateAssessmentId
  });

  return candidateAssessmentId;
}

export async function candidateExists(candidateId: string) {
  const row = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true }
  });

  return Boolean(row);
}

export async function findExistingCandidateByEmail(email: string) {
  const row = await findCandidateByEmail(email);
  if (!row) return null;

  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email
  };
}

function buildCandidateWhere(filters?: {
  roleId?: string;
  stage?: CandidateStage;
  stageValues?: string[];
  departmentId?: string;
  orgStage?: "active" | "finalized";
  finalizedAs?: "hired" | "rejected";
  q?: string;
  owner?: string;
}): Prisma.CandidateWhereInput {
  const where: Prisma.CandidateWhereInput = {};

  if (filters?.roleId) {
    where.roleId = filters.roleId;
  }
  if (filters?.stageValues?.length) {
    where.stage = { in: filters.stageValues };
  } else if (filters?.stage) {
    where.stage = filters.stage;
  }
  if (filters?.departmentId) {
    where.departmentId = filters.departmentId;
  }
  if (filters?.orgStage) {
    where.orgStage = filters.orgStage;
  }
  if (filters?.finalizedAs) {
    where.finalizedAs = filters.finalizedAs;
  }
  if (filters?.owner) {
    where.hrOwnerId = filters.owner;
  }
  const searchQuery = filters?.q?.trim();
  if (searchQuery) {
    where.OR = [
      { fullName: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
      { hrOwner: { contains: searchQuery, mode: "insensitive" } },
      { hrOwnerUser: { name: { contains: searchQuery, mode: "insensitive" } } },
      { hrOwnerUser: { email: { contains: searchQuery, mode: "insensitive" } } }
    ];
  }

  return where;
}

export async function listCandidates(filters?: {
  roleId?: string;
  stage?: CandidateStage;
  assessmentStatus?: CandidateAssessmentStatus;
}) {
  const rows = await prisma.candidate.findMany({
    where: buildCandidateWhere({
      roleId: filters?.roleId,
      stage: filters?.stage
    }),
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          resumes: true
        }
      },
      resumes: {
        orderBy: { uploadedAt: "desc" },
        take: 1,
        select: {
          storageKey: true
        }
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        include: {
          invite: {
            select: {
              slug: true,
              mode: true
            }
          },
          attempt: {
            select: {
              status: true,
              startedAt: true,
              submittedAt: true
            }
          }
        }
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          candidateId: true,
          type: true,
          title: true,
          status: true,
          sortOrder: true,
          mode: true,
          date: true,
          notes: true,
          score: true,
          result: true,
          recommendation: true,
          candidateAssessmentId: true,
          createdAt: true,
          updatedAt: true
        }
      },
      role: {
        select: {
          label: true,
          department: true
        }
      }
    }
  });

  const attemptIds = rows.flatMap((row) =>
    row.assessments
      .map((assessment) => assessment.attemptId)
      .filter((value): value is string => Boolean(value))
  );
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);

  const mapped = rows.map((row) => {
    const base = mapCandidate(row);
    const assessments = sortCandidateAssessmentsByLatestActivity(
      row.assessments.map((assessment) =>
        mapAssessment(
          assessment,
          assessment.attemptId ? resultsByAttemptId.get(assessment.attemptId) ?? null : null
        )
      )
    );
    const latest = assessments[0] ?? null;

    return {
      ...base,
      hasResume: row._count.resumes > 0,
      latestResumeStorageKey: row.resumes[0]?.storageKey ?? undefined,
      currentFocus: currentFocusFromMilestones(row.milestones.map((milestone) => mapMilestone(milestone))),
      latestAssessment: latest
    } satisfies CandidateListItem;
  });

  return mapped.filter((row) => {
    if (filters?.assessmentStatus) {
      const status = row.latestAssessment?.status ?? "none";
      if (status !== filters.assessmentStatus) return false;
    }
    return true;
  });
}

export async function listCandidateWorkspacePage(
  filters: CandidateWorkspaceFilters = {}
): Promise<CandidateWorkspacePage> {
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize ?? 12)));
  const skip = (page - 1) * pageSize;

  const where = buildCandidateWhere({
    roleId: filters.roleId,
    stage: filters.stage,
    stageValues: filters.stageValues,
    departmentId: filters.departmentId,
    orgStage: filters.orgStage,
    finalizedAs: filters.finalizedAs,
    owner: filters.owner,
    q: filters.q
  });

  const [dbCandidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: pageSize,
      skip,
      include: {
        _count: {
          select: { resumes: true }
        },
        resumes: {
          orderBy: { uploadedAt: "desc" },
          take: 1,
          select: { storageKey: true }
        },
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 3, // Limit to 3 most recent to reduce payload size in list views
          include: {
            invite: {
              select: { slug: true, mode: true }
            },
            attempt: {
              select: {
                status: true,
                startedAt: true,
                submittedAt: true
              }
            }
          }
        },
        milestones: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            candidateId: true,
            type: true,
            title: true,
            status: true,
            sortOrder: true,
            mode: true,
            date: true,
            notes: true,
            score: true,
            result: true,
            recommendation: true,
            candidateAssessmentId: true,
            createdAt: true,
            updatedAt: true
          }
        },
        role: {
          select: { label: true, department: true }
        },
        department: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.candidate.count({ where })
  ]);

  const attemptIds = dbCandidates.flatMap((row) =>
    row.assessments
      .map((assessment) => assessment.attemptId)
      .filter((value): value is string => Boolean(value))
  );
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);

  const candidates = dbCandidates.map((row) => {
    const base = mapCandidate(row);
    const assessments = sortCandidateAssessmentsByLatestActivity(
      row.assessments.map((assessment) =>
        mapAssessment(
          assessment,
          assessment.attemptId ? resultsByAttemptId.get(assessment.attemptId) ?? null : null
        )
      )
    );
    const latest = assessments[0] ?? null;

    return {
      ...base,
      hasResume: row._count.resumes > 0,
      latestResumeStorageKey: row.resumes[0]?.storageKey ?? undefined,
      currentFocus: currentFocusFromMilestones(row.milestones.map((milestone) => mapMilestone(milestone))),
      latestAssessment: latest
    } satisfies CandidateListItem;
  });

  const workspaceRows = candidates.map(toCandidateWorkspaceItem).filter((row) => {
    if (filters.assessmentStatus) {
      const status = row.latestAssessment?.status ?? "none";
      if (status !== filters.assessmentStatus) return false;
    }
    return true;
  });

  const sorted = sortCandidateWorkspaceItems(workspaceRows, filters.sort ?? "updated_desc");
  const roleOptions = (await listRoleCatalog()).map((role) => ({
    id: role.id,
    label: role.label,
    departmentId: role.departmentId
  }));

  // Get owners from User table instead of deriving from candidates
  const ownerUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  const ownerOptions = ownerUsers.map((user) => ({
    id: user.id,
    label: user.name ?? user.id
  }));

  return {
    rows: sorted,
    total,
    page,
    pageSize,
    roleOptions,
    ownerOptions,
    summary: buildCandidateOpenWorkSummary(sorted)
  };
}

export async function getCandidateDetail(candidateId: string): Promise<CandidateDetail | null> {
  const row = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      resumes: {
        orderBy: { uploadedAt: "desc" }
      },
      notes: {
        orderBy: { createdAt: "desc" }
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          jobPosting: {
            include: {
              role: {
                select: {
                  label: true,
                  department: true
                }
              }
            }
          }
        }
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        include: {
          invite: {
            select: {
              slug: true,
              mode: true
            }
          },
          attempt: {
            select: {
              status: true,
              startedAt: true,
              submittedAt: true
            }
          }
        }
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: {
          checks: {
            orderBy: { createdAt: "desc" }
          },
          candidateAssessment: {
            include: {
              invite: {
                select: {
                  slug: true,
                  mode: true
                }
              },
              attempt: {
                select: {
                  status: true,
                  startedAt: true,
                  submittedAt: true
                }
              }
            }
          }
        }
      },
      role: {
        select: {
          label: true,
          department: true
        }
      },
      departmentCandidacies: {
        orderBy: { updatedAt: "desc" },
        include: {
          department: {
            select: { id: true, name: true }
          },
          role: {
            select: { id: true, label: true }
          }
        }
      },
      activityEvents: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!row) {
    return null;
  }

  const attemptIds = row.assessments
    .map((assessment) => assessment.attemptId)
    .filter((value): value is string => Boolean(value));
  for (const milestone of row.milestones) {
    if (milestone.candidateAssessment?.attemptId) {
      attemptIds.push(milestone.candidateAssessment.attemptId);
    }
  }
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);
  const authorIds = row.notes
    .map((note) => note.createdById)
    .filter((value): value is string => Boolean(value));
  const authorsById = await loadUsersById(authorIds);
  const milestones = row.milestones.map((milestone) =>
    mapMilestone(
      milestone,
      milestone.candidateAssessment
        ? mapAssessment(
            milestone.candidateAssessment,
            milestone.candidateAssessment.attemptId
              ? resultsByAttemptId.get(milestone.candidateAssessment.attemptId) ?? null
              : null
          )
        : null
    )
  );
  const assessments = sortCandidateAssessmentsByLatestActivity(
    row.assessments.map((assessment) =>
      mapAssessment(
        assessment,
        assessment.attemptId ? resultsByAttemptId.get(assessment.attemptId) ?? null : null
      )
    )
  );

  return {
    ...mapCandidate(row),
    resumes: row.resumes.map(mapResume),
    notes: row.notes.map((note) => mapNote(note, note.createdById ? authorsById.get(note.createdById) ?? null : null)),
    assessments,
    applications: row.applications.map(mapApplication),
    milestones,
    departmentCandidacies: row.departmentCandidacies?.map((dc) => ({
      id: dc.id,
      candidateId: dc.candidateId,
      departmentId: dc.departmentId,
      roleId: dc.roleId ?? undefined,
      hrOwnerId: dc.hrOwnerId ?? undefined,
      status: dc.status as "active" | "talent_pool" | "dept_rejected",
      source: dc.source as "manual" | "job_application" | "nominated",
      nominatedBy: dc.nominatedBy ?? undefined,
      nominationNote: dc.nominationNote ?? undefined,
      jobPostingId: dc.jobPostingId ?? undefined,
      department: {
        id: dc.department.id,
        name: dc.department.name
      },
      role: dc.role ? {
        id: dc.role.id,
        label: dc.role.label
      } : undefined,
      createdAt: dc.createdAt.toISOString(),
      updatedAt: dc.updatedAt.toISOString()
    })) ?? undefined,
    activityEvents: row.activityEvents.map((event) => ({
      id: event.id,
      actorId: event.actorId ?? undefined,
      actorName: event.actorName ?? undefined,
      event: event.event,
      entityType: event.entityType ?? undefined,
      entityId: event.entityId ?? undefined,
      detail: event.detail ?? undefined,
      createdAt: event.createdAt.toISOString()
    })),
    currentFocus: currentFocusFromMilestones(milestones)
  };
}
