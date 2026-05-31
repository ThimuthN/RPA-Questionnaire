import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { APP_ACTIONS } from "@/lib/auth/permissions";

function isKnownPermission(permission: string) {
  return APP_ACTIONS.includes(permission as (typeof APP_ACTIONS)[number]);
}

export interface RoleCatalogEntry {
  id: string;
  slug: string;
  label: string;
  departmentId?: string;
  department?: string; // deprecated: kept for backward compatibility during migration
  departmentName?: string;
  description?: string;
  experienceLevel?: string;
  requirements?: string;
  sortOrder: number;
  isActive: boolean;
  permissions?: string[];
}

function slugifyRoleLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function mapRole(row: {
  id: string;
  slug: string;
  label: string;
  departmentId?: string | null;
  department?: string | null;
  dept?: { name: string } | null;
  departmentName?: string | null;
  description?: string | null;
  experienceLevel?: string | null;
  requirements?: string | null;
  sortOrder: number;
  isActive: boolean;
  permissions?: Array<{ permission: string }>;
}): RoleCatalogEntry {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    departmentId: row.departmentId ?? undefined,
    department: row.dept?.name ?? row.department ?? row.departmentName ?? undefined,
    departmentName: row.dept?.name ?? row.department ?? row.departmentName ?? undefined,
    description: row.description ?? undefined,
    experienceLevel: row.experienceLevel ?? undefined,
    requirements: row.requirements ?? undefined,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    permissions: row.permissions?.map((item) => item.permission).filter(isKnownPermission) ?? []
  };
}

const listRoleCatalogUncached = async (includeInactive = false, departmentId?: string): Promise<RoleCatalogEntry[]> => {
  const rows = await prisma.roleCatalog.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(departmentId ? { departmentId } : {})
    },
    select: {
      id: true,
      slug: true,
      label: true,
      departmentId: true,
      department: true,
      description: true,
      experienceLevel: true,
      requirements: true,
      sortOrder: true,
      isActive: true,
      permissions: {
        select: { permission: true },
        orderBy: { permission: "asc" }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
  });

  // Fetch departments separately to handle orphaned rows gracefully
  const uniqueDeptIds = [...new Set(rows.map((r) => r.departmentId).filter(Boolean))];
  const departments = await prisma.department.findMany({
    where: { id: { in: uniqueDeptIds } },
    select: { id: true, name: true }
  });
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  return rows.map((row) => ({
    ...mapRole({
      ...row,
      departmentName: row.departmentId ? deptMap.get(row.departmentId) : undefined
    })
  }));
};

export const listRoleCatalog = unstable_cache(
  (includeInactive = false, departmentId?: string) => listRoleCatalogUncached(includeInactive, departmentId),
  ["role-catalog"],
  { revalidate: 300, tags: ["role-catalog"] }
);

export async function getRoleCatalogEntry(roleId: string) {
  const row = await prisma.roleCatalog.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      slug: true,
      label: true,
      departmentId: true,
      department: true,
      description: true,
      experienceLevel: true,
      requirements: true,
      sortOrder: true,
      isActive: true,
      permissions: {
        select: { permission: true },
        orderBy: { permission: "asc" }
      }
    }
  });

  if (!row) return null;

  // Fetch department separately to handle orphaned references
  let deptName: string | undefined;
  if (row.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: row.departmentId },
      select: { name: true }
    });
    deptName = dept?.name;
  }

  return mapRole({
    ...row,
    departmentName: deptName
  });
}

export async function findRoleCatalogEntryByLabel(label: string, departmentId?: string) {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const slug = slugifyRoleLabel(trimmed);
  const rows = await prisma.roleCatalog.findMany({
    where: {
      OR: [{ label: trimmed }, { slug }]
    },
    select: {
      id: true,
      slug: true,
      label: true,
      departmentId: true,
      department: true,
      description: true,
      experienceLevel: true,
      requirements: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      permissions: {
        select: { permission: true },
        orderBy: { permission: "asc" }
      }
    },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  });

  // If departmentId is specified, prefer a match in that department
  const row =
    (departmentId && rows.find((candidate) => candidate.departmentId === departmentId)) ??
    rows[0];

  if (!row) return null;

  // Fetch department separately to handle orphaned references
  let deptName: string | undefined;
  if (row.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: row.departmentId },
      select: { name: true }
    });
    deptName = dept?.name;
  }

  return mapRole({
    ...row,
    departmentName: deptName
  });
}

export async function createRoleCatalogEntry(input: {
  label: string;
  departmentId?: string;
  description?: string;
  experienceLevel?: string;
  requirements?: string;
  permissions?: string[];
}) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Role label is required.");
  }

  // Default to System department if not specified
  let deptId = input.departmentId;
  if (!deptId) {
    const systemDept = await prisma.department.findUnique({
      where: { slug: "system" },
      select: { id: true }
    });
    if (!systemDept) {
      throw new Error("System department not found. Cannot create role without a department.");
    }
    deptId = systemDept.id;
  }

  // Check for duplicate in same department
  const existing = await findRoleCatalogEntryByLabel(label, deptId);
  if (existing && existing.departmentId === deptId) {
    return existing;
  }

  const last = await prisma.roleCatalog.findFirst({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: { sortOrder: true }
  });

  const created = await prisma.$transaction(async (tx) => {
    const role = await tx.roleCatalog.create({
      data: {
        slug: slugifyRoleLabel(label),
        label,
        departmentId: deptId,
        description: input.description?.trim() || null,
        experienceLevel: input.experienceLevel?.trim() || null,
        requirements: input.requirements?.trim() || null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        isActive: true
      }
    });

    if (input.permissions) {
      await tx.rolePermissionTemplate.createMany({
        data: input.permissions.map((permission) => ({
          roleId: role.id,
          permission,
          scope: "own_dept"
        })),
        skipDuplicates: true
      });
    }

    return tx.roleCatalog.findUniqueOrThrow({
      where: { id: role.id },
      select: {
        id: true,
        slug: true,
        label: true,
        departmentId: true,
        department: true,
        description: true,
        experienceLevel: true,
        requirements: true,
        sortOrder: true,
        isActive: true,
        permissions: {
          select: { permission: true },
          orderBy: { permission: "asc" }
        }
      }
    });
  });

  // Fetch department separately to handle orphaned references
  let deptName: string | undefined;
  if (created.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: created.departmentId },
      select: { name: true }
    });
    deptName = dept?.name;
  }

  revalidateTag("role-catalog");
  return mapRole({
    ...created,
    departmentName: deptName
  });
}

export async function updateRoleCatalogEntry(
  roleId: string,
  input: {
    label: string;
    departmentId?: string;
    description?: string;
    experienceLevel?: string;
    requirements?: string;
    isActive?: boolean;
    permissions?: string[];
  }
) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Role label is required.");
  }

  // Get the current role to preserve departmentId if not provided
  const currentRole = await prisma.roleCatalog.findUnique({
    where: { id: roleId },
    select: { departmentId: true }
  });

  if (!currentRole) {
    throw new Error("Role not found.");
  }

  const deptId = input.departmentId ?? currentRole.departmentId;

  const duplicate = await prisma.roleCatalog.findFirst({
    where: {
      id: { not: roleId },
      label,
      departmentId: deptId
    }
  });

  if (duplicate) {
    throw new Error("A role with that name already exists in that department.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.roleCatalog.update({
      where: { id: roleId },
      data: {
        slug: slugifyRoleLabel(label),
        label,
        departmentId: deptId,
        description: input.description?.trim() || null,
        experienceLevel: input.experienceLevel?.trim() || null,
        requirements: input.requirements?.trim() || null,
        isActive: input.isActive
      }
    });

    if (input.permissions) {
      await tx.rolePermissionTemplate.deleteMany({ where: { roleId } });
      await tx.rolePermissionTemplate.createMany({
        data: input.permissions.map((permission) => ({
          roleId,
          permission,
          scope: "own_dept"
        })),
        skipDuplicates: true
      });
    }

    return tx.roleCatalog.findUniqueOrThrow({
      where: { id: roleId },
      select: {
        id: true,
        slug: true,
        label: true,
        departmentId: true,
        department: true,
        description: true,
        experienceLevel: true,
        requirements: true,
        sortOrder: true,
        isActive: true,
        permissions: {
          select: { permission: true },
          orderBy: { permission: "asc" }
        }
      }
    });
  });

  // Fetch department separately to handle orphaned references
  let deptName: string | undefined;
  if (updated.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: updated.departmentId },
      select: { name: true }
    });
    deptName = dept?.name;
  }

  revalidateTag("role-catalog");
  return mapRole({
    ...updated,
    departmentName: deptName
  });
}

export async function resolveOrCreateRoleCatalogEntry(input: {
  roleId?: string;
  roleLabel?: string;
  legacyRoleLabel?: string;
  createIfMissing?: boolean;
}) {
  if (input.roleId?.trim()) {
    const existing = await getRoleCatalogEntry(input.roleId.trim());
    if (existing) return existing;
  }

  const label = input.roleLabel?.trim() || input.legacyRoleLabel?.trim();
  if (!label) return null;

  const existingByLabel = await findRoleCatalogEntryByLabel(label);
  if (existingByLabel) return existingByLabel;

  if (!input.createIfMissing) return null;
  return createRoleCatalogEntry({
    label
  });
}

export async function getRoleUsageCounts(roleId: string) {
  const [openJobCount, pipelineCandidateCount] = await Promise.all([
    prisma.jobPosting.count({ where: { roleId, isOpen: true } }),
    prisma.candidate.count({ where: { roleId, stage: "pipeline" } })
  ]);
  return { openJobCount, pipelineCandidateCount };
}

export async function deleteRoleCatalogEntry(roleId: string) {
  await prisma.roleCatalog.delete({ where: { id: roleId } });
  revalidateTag("role-catalog");
}
