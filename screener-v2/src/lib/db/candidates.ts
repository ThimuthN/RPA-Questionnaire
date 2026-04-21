import { del } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import type { RoleId } from "@/lib/assessment-engine/types";
import {
  defaultCandidateMilestones,
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
  CandidateFinalDecision,
  CandidateIntakeBucket,
  CandidateNextAction,
  CandidateNoteType,
  CandidateScreeningStatus,
  CandidateStage,
  CandidateUiStatus
} from "@/lib/candidates/types";
import { candidateUiStatusToStoredFields } from "@/lib/candidates/ui-status";
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
  coreBasisRoleId?: RoleId;
  positionAppliedFor?: string;
  batchId?: string;
  resumeSource?: string;
  hrOwner?: string;
  intakeBucket: CandidateIntakeBucket;
  stage: CandidateStage;
  finalDecision: CandidateFinalDecision;
  nextAction: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
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
}

export interface CandidateListItem extends CandidateRecord {
  hasResume: boolean;
  latestResumeStorageKey?: string;
  currentFocus?: string;
  latestAssessment: CandidateAssessmentRecord | null;
}

export interface CandidateDetail extends CandidateRecord {
  resumes: CandidateResumeRecord[];
  notes: CandidateNoteRecord[];
  assessments: CandidateAssessmentRecord[];
  applications: CandidateApplicationRecord[];
  milestones: CandidateMilestoneRecord[];
  currentFocus?: string;
}

export interface CandidateWorkspaceFilters {
  q?: string;
  roleId?: string;
  intakeBucket?: CandidateIntakeBucket;
  jobId?: string;
  status?: CandidateUiStatus;
  stage?: CandidateStage;
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
  roleOptions: Array<{ id: string; label: string }>;
  ownerOptions: string[];
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

function mapCandidate(row: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roleId: string | null;
  role: { label: string; department: string | null; coreBasisRoleId: string } | null;
  positionAppliedFor: string | null;
  batchId: string | null;
  resumeSource: string | null;
  hrOwner: string | null;
  intakeBucket: string;
  stage: string;
  finalDecision: string;
  nextAction: string;
  screeningStatus: string | null;
  candidateFolderUrl: string | null;
  notesSummary: string | null;
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
    coreBasisRoleId: (row.role?.coreBasisRoleId as RoleId | null) ?? undefined,
    positionAppliedFor: row.positionAppliedFor ?? row.role?.label ?? undefined,
    batchId: row.batchId ?? undefined,
    resumeSource: row.resumeSource ?? undefined,
    hrOwner: row.hrOwner ?? undefined,
    intakeBucket: row.intakeBucket as CandidateIntakeBucket,
    stage: row.stage as CandidateStage,
    finalDecision: row.finalDecision as CandidateFinalDecision,
    nextAction: row.nextAction as CandidateNextAction,
    screeningStatus: (row.screeningStatus as CandidateScreeningStatus | null) ?? undefined,
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
  createdById: string | null;
}, author?: { name: string | null; email: string } | null): CandidateNoteRecord {
  return {
    id: row.id,
    candidateId: row.candidateId,
    type: row.type as CandidateNoteType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
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
    assessment: assessment ?? null
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
  positionAppliedFor?: string;
  batchId?: string;
  resumeSource?: string;
  hrOwner?: string;
  intakeBucket?: CandidateIntakeBucket;
  stage?: CandidateStage;
  finalDecision?: CandidateFinalDecision;
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
    createIfMissing: Boolean(input.positionAppliedFor?.trim()),
    defaultCoreBasisRoleId: "Associate"
  });

  const created = await prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.create({
      data: {
        id: cuidLike(),
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: input.phone?.trim() || null,
        roleId: resolvedRole?.id ?? null,
        positionAppliedFor: (resolvedRole?.label ?? input.positionAppliedFor?.trim()) || null,
        batchId: input.batchId?.trim() || null,
        resumeSource: input.resumeSource?.trim() || null,
        hrOwner: input.hrOwner?.trim() || null,
        intakeBucket: input.intakeBucket ?? "pipeline",
        stage: input.stage ?? "new",
        finalDecision: input.finalDecision ?? "in_process",
        nextAction: input.nextAction ?? "none",
        screeningStatus: input.screeningStatus ?? null,
        candidateFolderUrl: input.candidateFolderUrl?.trim() || null,
        notesSummary: input.notesSummary?.trim() || null
      },
      include: {
        role: {
          select: {
            label: true,
            department: true,
            coreBasisRoleId: true
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

    return candidate;
  });

  return mapCandidate(created);
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
    stage: CandidateStage;
    finalDecision: CandidateFinalDecision;
    nextAction: CandidateNextAction;
    screeningStatus?: CandidateScreeningStatus;
    candidateFolderUrl?: string;
    notesSummary?: string;
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
    createIfMissing: Boolean(input.positionAppliedFor?.trim()),
    defaultCoreBasisRoleId: "Associate"
  });

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      fullName: input.fullName.trim(),
      email: normalizedEmail,
      phone: input.phone?.trim() || null,
      roleId: resolvedRole?.id ?? null,
      positionAppliedFor: (resolvedRole?.label ?? input.positionAppliedFor?.trim()) || null,
      batchId: input.batchId?.trim() || null,
      resumeSource: input.resumeSource?.trim() || null,
      hrOwner: input.hrOwner?.trim() || null,
      stage: input.stage,
      finalDecision: input.finalDecision,
      nextAction: input.nextAction,
      screeningStatus: input.screeningStatus ?? null,
      candidateFolderUrl: input.candidateFolderUrl?.trim() || null,
      notesSummary: input.notesSummary?.trim() || null
    },
    include: {
      role: {
        select: {
          label: true,
          department: true,
          coreBasisRoleId: true
        }
      }
    }
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

    for (const participantId of participantIds) {
      const remainingAttempts = await tx.attempt.count({
        where: { participantId }
      });

      if (remainingAttempts === 0) {
        await tx.participant.delete({
          where: { id: participantId }
        });
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
  const created = await prisma.candidateNote.create({
    data: {
      id: cuidLike(),
      candidateId: input.candidateId,
      type: input.type,
      body: input.body.trim(),
      createdById: input.createdById ?? null
    }
  });

  await prisma.candidate.update({
    where: { id: input.candidateId },
    data: {
      updatedAt: new Date()
    }
  });

  return mapNote(created);
}

export async function bulkUpdateCandidates(input: {
  candidateIds: string[];
  action: "assign_owner" | "set_ui_status" | "add_note";
  owner?: string;
  status?: CandidateUiStatus;
  noteBody?: string;
  noteType?: CandidateNoteType;
  createdById?: string;
}) {
  const candidateIds = [...new Set(input.candidateIds.filter(Boolean))];
  if (candidateIds.length === 0) {
    throw new Error("Select at least one candidate.");
  }

  if (input.action === "assign_owner") {
    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        hrOwner: input.owner?.trim() || null,
        updatedAt: new Date()
      }
    });
    return { updatedCount: candidateIds.length };
  }

  if (input.action === "set_ui_status") {
    if (!input.status) {
      throw new Error("Choose a status.");
    }

    const fields = candidateUiStatusToStoredFields(input.status);
    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        stage: fields.stage,
        finalDecision: fields.finalDecision,
        nextAction: fields.nextAction,
        screeningStatus: fields.screeningStatus ?? null,
        updatedAt: new Date()
      }
    });
    return { updatedCount: candidateIds.length };
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
  }
) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: milestoneId,
      candidateId
    },
    select: { id: true }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  const updated = await prisma.candidateMilestone.update({
    where: { id: milestoneId },
    data: {
      title: input.title?.trim(),
      status: input.status,
      mode: input.mode,
      date: input.date ? new Date(input.date) : input.date === "" ? null : undefined,
      notes: typeof input.notes === "string" ? input.notes.trim() || null : undefined,
      score: typeof input.score === "number" && Number.isFinite(input.score) ? input.score : input.score === null ? null : undefined,
      result: input.result ?? undefined,
      recommendation:
        typeof input.recommendation === "string" ? input.recommendation.trim() || null : undefined
    }
  });

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      updatedAt: new Date()
    }
  });

  return mapMilestone(updated);
}

export async function quickUpdateCandidateMilestoneStatus(
  candidateId: string,
  milestoneId: string,
  status: CandidateMilestoneStatus
) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: milestoneId,
      candidateId
    },
    select: { id: true }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  const updated = await prisma.candidateMilestone.update({
    where: { id: milestoneId },
    data: {
      status
    }
  });

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      updatedAt: new Date()
    }
  });

  return mapMilestone(updated);
}

export async function linkCandidateAssessmentToMilestone(input: {
  candidateId: string;
  milestoneId: string;
  candidateAssessmentId: string;
}) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: input.milestoneId,
      candidateId: input.candidateId
    },
    select: {
      id: true
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

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });
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

export async function listCandidates(filters?: {
  roleId?: string;
  intakeBucket?: CandidateIntakeBucket;
  stage?: CandidateStage;
  finalDecision?: CandidateFinalDecision;
  assessmentStatus?: CandidateAssessmentStatus;
}) {
  const rows = await prisma.candidate.findMany({
    where: {
      intakeBucket: filters?.intakeBucket
    },
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
          department: true,
          coreBasisRoleId: true
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
    if (filters?.roleId && row.roleId !== filters.roleId) return false;
    if (filters?.stage && row.stage !== filters.stage) return false;
    if (filters?.finalDecision && row.finalDecision !== filters.finalDecision) return false;
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
  const candidates = await listCandidates({
    intakeBucket: filters.intakeBucket,
    roleId: filters.roleId,
    stage: filters.stage,
    assessmentStatus: filters.assessmentStatus
  });
  const query = filters.q?.trim().toLowerCase() ?? "";
  const roleId = filters.roleId?.trim() ?? "";
  const status = filters.status;
  const owner = filters.owner?.trim() ?? "";
  const sort = filters.sort ?? "updated_desc";
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize ?? 12)));

  const workspaceRows = candidates.map(toCandidateWorkspaceItem).filter((row) => {
    if (query) {
      const haystack = [
        row.fullName,
        row.email,
        row.positionAppliedFor || "",
        row.hrOwner || "",
        row.currentFocus || "",
        row.notesSummary || ""
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (roleId && (row.roleId || "") !== roleId) return false;
    if (status && row.uiStatus !== status) return false;
    if (owner && (row.hrOwner || "") !== owner) return false;
    return true;
  });

  const sorted = sortCandidateWorkspaceItems(workspaceRows, sort);
  const start = (page - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);
  const roleOptions = (await listRoleCatalog()).map((role) => ({
    id: role.id,
    label: role.label
  }));
  const ownerOptions = [...new Set(candidates.map((row) => row.hrOwner).filter(Boolean))].sort() as string[];

  return {
    rows,
    total: sorted.length,
    page,
    pageSize,
    roleOptions,
    ownerOptions,
    summary: buildCandidateOpenWorkSummary(workspaceRows)
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
          department: true,
          coreBasisRoleId: true
        }
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
    currentFocus: currentFocusFromMilestones(milestones)
  };
}
