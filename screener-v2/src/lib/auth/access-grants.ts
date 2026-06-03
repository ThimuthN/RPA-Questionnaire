import { prisma } from "@/lib/db/prisma";

/**
 * Create a system-scoped AccessGrant for a user.
 * Grants access to a system-level role (e.g., system-admin).
 * System roles are in the "system" department.
 */
export async function grantSystemAccess(input: {
  userId: string;
  roleSlug: "system-admin" | string;
}) {
  const systemDept = await prisma.department.findUnique({
    where: { slug: "system" },
    select: { id: true }
  });

  if (!systemDept) {
    throw new Error("System department not found");
  }

  const role = await prisma.roleCatalog.findFirst({
    where: {
      slug: input.roleSlug,
      departmentId: systemDept.id,
      kind: "access_role"
    },
    select: { id: true }
  });

  if (!role) {
    throw new Error(`System role "${input.roleSlug}" not found`);
  }

  const existingGrant = await prisma.accessGrant.findFirst({
    where: {
      userId: input.userId,
      roleId: role.id,
      departmentId: systemDept.id,
      status: "active"
    }
  });

  if (existingGrant) {
    throw new Error(`User already has ${input.roleSlug} access`);
  }

  return prisma.accessGrant.create({
    data: {
      userId: input.userId,
      roleId: role.id,
      departmentId: systemDept.id,
      scope: "system",
      status: "active"
    },
    select: {
      id: true,
      scope: true,
      status: true,
      role: { select: { slug: true, label: true } }
    }
  });
}

/**
 * Create a department-scoped AccessGrant for a user.
 * Grants access to a department-level access role.
 */
export async function grantDepartmentAccess(input: {
  userId: string;
  departmentId: string;
  roleId: string;
}) {
  // Verify role exists and is an access_role
  const role = await prisma.roleCatalog.findUnique({
    where: { id: input.roleId },
    select: { id: true, kind: true, label: true }
  });

  if (!role) {
    throw new Error("Access role not found");
  }

  if (role.kind !== "access_role") {
    throw new Error("Only access roles can be assigned");
  }

  // Verify department exists
  const dept = await prisma.department.findUnique({
    where: { id: input.departmentId },
    select: { id: true }
  });

  if (!dept) {
    throw new Error("Department not found");
  }

  // Check for duplicate active grant
  const existing = await prisma.accessGrant.findFirst({
    where: {
      userId: input.userId,
      departmentId: input.departmentId,
      roleId: input.roleId,
      status: "active"
    }
  });

  if (existing) {
    throw new Error("User already has this role in this department");
  }

  return prisma.accessGrant.create({
    data: {
      userId: input.userId,
      departmentId: input.departmentId,
      roleId: input.roleId,
      scope: "department",
      status: "active"
    },
    select: {
      id: true,
      scope: true,
      status: true,
      departmentId: true,
      role: { select: { id: true, slug: true, label: true } }
    }
  });
}

/**
 * List department team members via AccessGrant.
 * Returns users with active department-scoped grants for this department.
 */
export async function listDepartmentTeamViaAccessGrant(departmentId: string) {
  const grants = await prisma.accessGrant.findMany({
    where: {
      departmentId,
      scope: "department",
      status: "active"
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      },
      role: {
        select: {
          id: true,
          label: true,
          permissions: { select: { permission: true } }
        }
      }
    },
    orderBy: { user: { name: "asc" } }
  });

  return grants.map((grant) => ({
    id: grant.user.id,
    name: grant.user.name,
    email: grant.user.email,
    isActive: grant.user.isActive,
    roleId: grant.role.id,
    role: grant.role,
    permissions: grant.role.permissions.map((p) => p.permission)
  }));
}

/**
 * Search users by email with bounded results.
 */
export async function searchUsers(query: string, limit: number = 20) {
  if (!query || query.length < 1) {
    return [];
  }

  if (limit > 100) {
    limit = 100; // Safety cap
  }

  const email = query.toLowerCase().trim();

  return prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: email, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      accessGrants: {
        where: { status: "active" },
        select: {
          scope: true,
          departmentId: true,
          role: { select: { slug: true, label: true } }
        }
      }
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: limit
  });
}

/**
 * Get user's current access grants (summary).
 */
export async function getUserAccessSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      accessGrants: {
        where: { status: "active" },
        select: {
          scope: true,
          department: { select: { id: true, name: true } },
          role: { select: { slug: true, label: true } }
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    grants: user.accessGrants,
    systemGrantCount: user.accessGrants.filter((g) => g.scope === "system").length,
    departmentGrantCount: user.accessGrants.filter((g) => g.scope === "department").length
  };
}
