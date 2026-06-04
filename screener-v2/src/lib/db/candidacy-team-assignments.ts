import type { HiringTeamRole } from "@prisma/client";
import type { DepartmentCandidacyTeamAssignmentSource } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";
import { listDepartmentTeamViaAccessGrant } from "@/lib/auth/access-grants";

export interface CandidacyTeamAssignmentInput {
  candidacyId: string;
  userId: string;
  role: HiringTeamRole;
  source?: DepartmentCandidacyTeamAssignmentSource;
  templateId?: string;
  isPrimary?: boolean;
  addedById?: string;
}

export async function validateCandidacyTeamUser(
  candidacyId: string,
  userId: string
) {
  // Get candidacy to find department
  const candidacy = await prisma.departmentCandidacy.findUnique({
    where: { id: candidacyId },
    select: { departmentId: true }
  });

  if (!candidacy) {
    throw new Error("Candidacy not found");
  }

  // Verify user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true }
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or is inactive");
  }

  // Verify user has active AccessGrant for this department (unless system admin)
  const departmentTeam = await listDepartmentTeamViaAccessGrant(candidacy.departmentId);
  const isInDepartmentTeam = departmentTeam.some((member) => member.id === userId);

  if (!isInDepartmentTeam) {
    throw new Error("User is not a member of this department team");
  }

  return candidacy.departmentId;
}

export async function addCandidacyTeamAssignment(
  input: CandidacyTeamAssignmentInput
) {
  // Validate user
  await validateCandidacyTeamUser(input.candidacyId, input.userId);

  // Check if assignment already exists
  const existing = await prisma.departmentCandidacyTeamAssignment.findFirst({
    where: {
      candidacyId: input.candidacyId,
      userId: input.userId,
      role: input.role,
      isActive: true
    }
  });

  if (existing) {
    throw new Error("Assignment already exists");
  }

  // If isPrimary, unset other primary for this role
  if (input.isPrimary) {
    await prisma.departmentCandidacyTeamAssignment.updateMany({
      where: {
        candidacyId: input.candidacyId,
        role: input.role,
        isPrimary: true,
        userId: { not: input.userId },
        isActive: true
      },
      data: { isPrimary: false }
    });
  }

  return prisma.departmentCandidacyTeamAssignment.create({
    data: {
      id: cuidLike(),
      candidacyId: input.candidacyId,
      userId: input.userId,
      role: input.role,
      source: input.source ?? "manual",
      templateId: input.templateId ?? null,
      isPrimary: input.isPrimary ?? (input.role === "owner"),
      isActive: true,
      addedAt: new Date(),
      addedById: input.addedById ?? null
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function getCandidacyTeamAssignments(candidacyId: string) {
  return prisma.departmentCandidacyTeamAssignment.findMany({
    where: { candidacyId, isActive: true },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      addedBy: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: [{ role: "asc" }, { isPrimary: "desc" }]
  });
}

export async function replaceCandidacyTeamAssignments(
  candidacyId: string,
  assignments: CandidacyTeamAssignmentInput[],
  actorId?: string
) {
  return prisma.$transaction(async (tx) => {
    // Deactivate all existing assignments
    await tx.departmentCandidacyTeamAssignment.updateMany({
      where: { candidacyId, isActive: true },
      data: { isActive: false }
    });

    const created: any[] = [];

    for (const assignment of assignments) {
      // Validate user for this candidacy
      const candidacy = await tx.departmentCandidacy.findUnique({
        where: { id: candidacyId },
        select: { departmentId: true }
      });

      if (!candidacy) {
        throw new Error("Candidacy not found");
      }

      const user = await tx.user.findUnique({
        where: { id: assignment.userId },
        select: { id: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new Error(`User ${assignment.userId} not found or inactive`);
      }

      // Create assignment
      const created_assignment = await tx.departmentCandidacyTeamAssignment.create({
        data: {
          id: cuidLike(),
          candidacyId,
          userId: assignment.userId,
          role: assignment.role,
          source: assignment.source ?? "manual",
          templateId: assignment.templateId ?? null,
          isPrimary: assignment.isPrimary ?? (assignment.role === "owner"),
          isActive: true,
          addedAt: new Date(),
          addedById: actorId ?? null
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      created.push(created_assignment);
    }

    return created;
  });
}

export async function requireCandidacyOwner(candidacyId: string) {
  const owner = await prisma.departmentCandidacyTeamAssignment.findFirst({
    where: {
      candidacyId,
      role: "owner",
      isActive: true
    }
  });

  if (!owner) {
    throw new Error("Candidacy must have at least one owner");
  }

  return owner;
}

export async function removeCandidacyTeamAssignment(
  candidacyId: string,
  userId: string,
  role: HiringTeamRole
) {
  // If removing owner, check there's another owner
  if (role === "owner") {
    const remainingOwners = await prisma.departmentCandidacyTeamAssignment.count({
      where: {
        candidacyId,
        role: "owner",
        userId: { not: userId },
        isActive: true
      }
    });

    if (remainingOwners === 0) {
      throw new Error("Cannot remove the last owner of a candidacy");
    }
  }

  return prisma.departmentCandidacyTeamAssignment.update({
    where: {
      candidacyId_userId_role: {
        candidacyId,
        userId,
        role
      }
    },
    data: { isActive: false, updatedAt: new Date() }
  });
}

export async function copyTemplateToCandicacy(
  candidacyId: string,
  templateId: string,
  actorId?: string
) {
  const template = await prisma.hiringTeamTemplate.findUnique({
    where: { id: templateId },
    include: { members: true }
  });

  if (!template) {
    throw new Error("Template not found");
  }

  // Replace assignments with template members
  const assignments = template.members.map((member) => ({
    candidacyId,
    userId: member.userId,
    role: member.role,
    source: "template" as const,
    templateId,
    isPrimary: member.role === "owner",
    addedById: actorId
  }));

  return replaceCandidacyTeamAssignments(candidacyId, assignments, actorId);
}
