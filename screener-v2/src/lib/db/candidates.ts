import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type {
  CandidateAssessmentStatus,
  CandidateFinalDecision,
  CandidateNextAction,
  CandidateNoteType,
  CandidateScreeningStatus,
  CandidateStage
} from "@/lib/candidates/types";

function cuidLike() {
  return crypto.randomUUID().replace(/-/g, "");
}

export interface CandidateRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
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
}

export interface CandidateAssessmentRecord {
  id: string;
  inviteId: string;
  inviteSlug: string;
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

export interface CandidateListItem extends CandidateRecord {
  hasResume: boolean;
  latestAssessment: CandidateAssessmentRecord | null;
}

export interface CandidateDetail extends CandidateRecord {
  resumes: CandidateResumeRecord[];
  notes: CandidateNoteRecord[];
  assessments: CandidateAssessmentRecord[];
}

function mapCandidate(row: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  positionAppliedFor: string | null;
  batchId: string | null;
  resumeSource: string | null;
  hrOwner: string | null;
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
    positionAppliedFor: row.positionAppliedFor ?? undefined,
    batchId: row.batchId ?? undefined,
    resumeSource: row.resumeSource ?? undefined,
    hrOwner: row.hrOwner ?? undefined,
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
}): CandidateNoteRecord {
  return {
    id: row.id,
    candidateId: row.candidateId,
    type: row.type as CandidateNoteType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    createdById: row.createdById ?? undefined
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
    invite: { slug: string };
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

export async function createCandidate(input: {
  fullName: string;
  email: string;
  phone?: string;
  positionAppliedFor?: string;
  batchId?: string;
  resumeSource?: string;
  hrOwner?: string;
  stage?: CandidateStage;
  finalDecision?: CandidateFinalDecision;
  nextAction?: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
  candidateFolderUrl?: string;
  notesSummary?: string;
}) {
  const created = await prisma.candidate.create({
    data: {
      id: cuidLike(),
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      positionAppliedFor: input.positionAppliedFor?.trim() || null,
      batchId: input.batchId?.trim() || null,
      resumeSource: input.resumeSource?.trim() || null,
      hrOwner: input.hrOwner?.trim() || null,
      stage: input.stage ?? "new",
      finalDecision: input.finalDecision ?? "in_process",
      nextAction: input.nextAction ?? "none",
      screeningStatus: input.screeningStatus ?? null,
      candidateFolderUrl: input.candidateFolderUrl?.trim() || null,
      notesSummary: input.notesSummary?.trim() || null
    }
  });

  return mapCandidate(created);
}

export async function updateCandidate(
  candidateId: string,
  input: {
    fullName: string;
    email: string;
    phone?: string;
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
  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      positionAppliedFor: input.positionAppliedFor?.trim() || null,
      batchId: input.batchId?.trim() || null,
      resumeSource: input.resumeSource?.trim() || null,
      hrOwner: input.hrOwner?.trim() || null,
      stage: input.stage,
      finalDecision: input.finalDecision,
      nextAction: input.nextAction,
      screeningStatus: input.screeningStatus ?? null,
      candidateFolderUrl: input.candidateFolderUrl?.trim() || null,
      notesSummary: input.notesSummary?.trim() || null
    }
  });

  return mapCandidate(updated);
}

export async function addCandidateResume(input: {
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
}) {
  const created = await prisma.candidateResume.create({
    data: {
      id: cuidLike(),
      candidateId: input.candidateId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey: input.storageKey,
      storageUrl: input.storageUrl
    }
  });

  await prisma.candidate.update({
    where: { id: input.candidateId },
    data: {
      updatedAt: new Date()
    }
  });

  return mapResume(created);
}

export async function getLatestCandidateResume(candidateId: string) {
  const row = await prisma.candidateResume.findFirst({
    where: { candidateId },
    orderBy: { uploadedAt: "desc" }
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

export async function createCandidateAssessmentLink(input: {
  candidateId: string;
  inviteId: string;
  createdById?: string;
}) {
  return prisma.candidateAssessment.create({
    data: {
      id: cuidLike(),
      candidateId: input.candidateId,
      inviteId: input.inviteId,
      createdById: input.createdById ?? null
    }
  });
}

export async function attachAttemptToCandidateAssessment(input: {
  inviteId: string;
  attemptId: string;
}) {
  const link = await prisma.candidateAssessment.findUnique({
    where: { inviteId: input.inviteId }
  });

  if (!link) {
    return null;
  }

  return prisma.candidateAssessment.update({
    where: { inviteId: input.inviteId },
    data: {
      attemptId: input.attemptId
    }
  });
}

export async function candidateExists(candidateId: string) {
  const row = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true }
  });

  return Boolean(row);
}

export async function listCandidates(filters?: {
  stage?: CandidateStage;
  finalDecision?: CandidateFinalDecision;
  assessmentStatus?: CandidateAssessmentStatus;
}) {
  const rows = await prisma.candidate.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          resumes: true
        }
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          invite: {
            select: {
              slug: true
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
  });

  const attemptIds = rows
    .map((row) => row.assessments[0]?.attemptId)
    .filter((value): value is string => Boolean(value));
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);

  const mapped = rows.map((row) => {
    const base = mapCandidate(row);
    const latest = row.assessments[0] ?? null;

    return {
      ...base,
      hasResume: row._count.resumes > 0,
      latestAssessment: latest
        ? mapAssessment(
            latest,
            latest.attemptId ? resultsByAttemptId.get(latest.attemptId) ?? null : null
          )
        : null
    } satisfies CandidateListItem;
  });

  return mapped.filter((row) => {
    if (filters?.stage && row.stage !== filters.stage) return false;
    if (filters?.finalDecision && row.finalDecision !== filters.finalDecision) return false;
    if (filters?.assessmentStatus) {
      const status = row.latestAssessment?.status ?? "none";
      if (status !== filters.assessmentStatus) return false;
    }
    return true;
  });
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
      assessments: {
        orderBy: { createdAt: "desc" },
        include: {
          invite: {
            select: {
              slug: true
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
  });

  if (!row) {
    return null;
  }

  const attemptIds = row.assessments
    .map((assessment) => assessment.attemptId)
    .filter((value): value is string => Boolean(value));
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);

  return {
    ...mapCandidate(row),
    resumes: row.resumes.map(mapResume),
    notes: row.notes.map(mapNote),
    assessments: row.assessments.map((assessment) =>
      mapAssessment(
        assessment,
        assessment.attemptId ? resultsByAttemptId.get(assessment.attemptId) ?? null : null
      )
    )
  };
}
