import type { HiringAssignmentRole } from "@prisma/client";
import { prisma } from "./prisma";

export type AssignmentInput = {
  userId: string;
  assignmentRole: HiringAssignmentRole;
  isPrimary?: boolean;
};

export type BulkAssignmentMode = "add" | "replace_role";

export async function validateUsers(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, isActive: true },
    select: { id: true }
  });
  const foundIds = new Set(users.map((u) => u.id));
  const missing = userIds.filter((id) => !foundIds.has(id));
  return { valid: missing.length === 0, missing };
}

export async function getApplicationAssignments(applicationId: string) {
  const assignments = await prisma.hiringAssignment.findMany({
    where: { applicationId, active: true },
    include: {
      user: {
        select: { id: true, name: true, email: true, departmentId: true }
      }
    },
    orderBy: [{ assignmentRole: "asc" }, { isPrimary: "desc" }]
  });
  return assignments;
}

export async function setApplicationAssignments(
  applicationId: string,
  mode: BulkAssignmentMode,
  assignments: AssignmentInput[],
  assignedById?: string
) {
  // Validate application exists
  const application = await prisma.candidateApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, candidateId: true }
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Validate users exist and are active
  const userIds = assignments.map((a) => a.userId);
  const validation = await validateUsers(userIds);
  if (!validation.valid) {
    throw new Error(`Invalid user IDs: ${validation.missing.join(", ")}`);
  }

  if (mode === "replace_role") {
    const roles = assignments.map((a) => a.assignmentRole);
    await prisma.hiringAssignment.updateMany({
      where: {
        applicationId,
        assignmentRole: { in: roles },
        active: true
      },
      data: { active: false }
    });
  }

  const result = {
    created: 0,
    updated: 0,
    primaryRoleConflicts: [] as string[]
  };

  for (const assignment of assignments) {
    const existing = await prisma.hiringAssignment.findFirst({
      where: {
        applicationId,
        userId: assignment.userId,
        assignmentRole: assignment.assignmentRole
      }
    });

    if (assignment.isPrimary) {
      const otherPrimary = await prisma.hiringAssignment.findFirst({
        where: {
          applicationId,
          assignmentRole: assignment.assignmentRole,
          isPrimary: true,
          userId: { not: assignment.userId },
          active: true
        }
      });

      if (otherPrimary) {
        await prisma.hiringAssignment.update({
          where: { id: otherPrimary.id },
          data: { isPrimary: false }
        });
        result.primaryRoleConflicts.push(
          `Removed primary flag from ${assignment.assignmentRole} role for another user`
        );
      }
    }

    if (existing) {
      if (!existing.active) {
        await prisma.hiringAssignment.update({
          where: { id: existing.id },
          data: { active: true, isPrimary: assignment.isPrimary ?? false, assignedById, updatedAt: new Date() }
        });
      } else {
        await prisma.hiringAssignment.update({
          where: { id: existing.id },
          data: { isPrimary: assignment.isPrimary ?? false, assignedById, updatedAt: new Date() }
        });
      }
      result.updated++;
    } else {
      await prisma.hiringAssignment.create({
        data: {
          applicationId,
          userId: assignment.userId,
          assignmentRole: assignment.assignmentRole,
          isPrimary: assignment.isPrimary ?? false,
          assignedById,
          active: true
        }
      });
      result.created++;
    }
  }

  return result;
}

export async function bulkAssignApplications(
  applicationIds: string[],
  mode: BulkAssignmentMode,
  assignments: AssignmentInput[],
  assignedById?: string
) {
  const userIds = assignments.map((a) => a.userId);
  const validation = await validateUsers(userIds);
  if (!validation.valid) {
    throw new Error(`Invalid user IDs: ${validation.missing.join(", ")}`);
  }

  const results = {
    updated: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>
  };

  for (const appId of applicationIds) {
    try {
      const result = await setApplicationAssignments(appId, mode, assignments, assignedById);
      results.updated += result.created + result.updated;
    } catch (error) {
      results.failed++;
      results.errors.push({
        id: appId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return results;
}

