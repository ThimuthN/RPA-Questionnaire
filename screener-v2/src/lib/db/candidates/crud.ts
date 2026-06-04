import { del } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import {
  defaultCandidateMilestones,
  type CandidateMilestoneMode,
  type CandidateMilestoneStatus,
  type CandidateMilestoneType
} from "@/lib/candidates/milestones";
import { resolveOrCreateRoleCatalogEntry } from "@/lib/roles/catalog";
import type {
  CandidateNextAction,
  CandidateScreeningStatus,
  CandidateStage
} from "@/lib/candidates/types";
import { cuidLike } from "@/lib/tokens/token-service";
import { logError } from "@/lib/server/logger";
import { mapCandidate } from "./mappers";
import { logActivityEvent } from "./activity";

type CandidateTeamAssignmentInput = {
  userId: string;
  role: "owner" | "recruiter" | "hiring_manager" | "interviewer" | "reviewer" | "final_approver";
  source?: "template" | "manual" | "job_default";
  templateId?: string;
  isPrimary?: boolean;
};

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
  teamAssignments?: CandidateTeamAssignmentInput[];
  teamUserIds?: Array<Pick<CandidateTeamAssignmentInput, "userId" | "role">>;
  createMilestones?: boolean;
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
  const normalizedTeamAssignments: CandidateTeamAssignmentInput[] =
    input.teamAssignments ??
    input.teamUserIds?.map((teamUser) => ({
      userId: teamUser.userId,
      role: teamUser.role,
      source: "manual" as const
    })) ??
    [];
  const primaryOwnerAssignment =
    normalizedTeamAssignments.find((assignment) => assignment.role === "owner" && assignment.isPrimary !== false) ??
    normalizedTeamAssignments.find((assignment) => assignment.role === "owner");

  const created = await prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.create({
      data: {
        id: cuidLike(),
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: input.phone?.trim() || null,
        roleId: resolvedRole?.id ?? null,
        departmentId: input.departmentId || null,
        hrOwnerId: input.hrOwnerId || primaryOwnerAssignment?.userId || null,
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

    if (input.createMilestones !== false) {
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
    }

    let candidacy = null;
    if (candidate.departmentId) {
      candidacy = await tx.departmentCandidacy.upsert({
        where: {
          candidateId_departmentId: {
            candidateId: candidate.id,
            departmentId: candidate.departmentId
          }
        },
        update: {
          roleId: candidate.roleId,
          hrOwnerId: input.hrOwnerId || primaryOwnerAssignment?.userId || null,
          status: "active",
          updatedAt: new Date()
        },
        create: {
          id: cuidLike(),
          candidateId: candidate.id,
          departmentId: candidate.departmentId,
          roleId: candidate.roleId,
          hrOwnerId: input.hrOwnerId || primaryOwnerAssignment?.userId || null,
          status: "active",
          source: "manual"
        }
      });

      if (candidacy && normalizedTeamAssignments.length > 0) {
        for (const teamAssignment of normalizedTeamAssignments) {
          await tx.departmentCandidacyTeamAssignment.create({
            data: {
              id: cuidLike(),
              candidacyId: candidacy.id,
              userId: teamAssignment.userId,
              role: teamAssignment.role,
              source: teamAssignment.source ?? "manual",
              templateId: teamAssignment.templateId ?? null,
              isPrimary:
                teamAssignment.isPrimary ??
                (teamAssignment.role === "owner" && teamAssignment.userId === primaryOwnerAssignment?.userId),
              isActive: true,
              addedAt: new Date()
            }
          });
        }
      }
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
