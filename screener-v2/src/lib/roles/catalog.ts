import { prisma } from "@/lib/db/prisma";

export interface RoleCatalogEntry {
  id: string;
  slug: string;
  label: string;
  department?: string;
  sortOrder: number;
  isActive: boolean;
}

function slugifyRoleLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeDepartment(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "";
}

function slugifyRoleIdentity(label: string, department?: string) {
  const parts = [label.trim(), normalizeDepartment(department)].filter(Boolean);
  return slugifyRoleLabel(parts.join(" "));
}

function mapRole(row: {
  id: string;
  slug: string;
  label: string;
  department?: string | null;
  sortOrder: number;
  isActive: boolean;
}): RoleCatalogEntry {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    department: row.department ?? undefined,
    sortOrder: row.sortOrder,
    isActive: row.isActive
  };
}

export async function listRoleCatalog(includeInactive = false): Promise<RoleCatalogEntry[]> {
  const rows = await prisma.roleCatalog.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
  });

  return rows.map((row) => mapRole(row));
}

export async function getRoleCatalogEntry(roleId: string) {
  const row = await prisma.roleCatalog.findUnique({
    where: { id: roleId }
  });

  return row ? mapRole(row) : null;
}

export async function findRoleCatalogEntryByLabel(label: string, department?: string) {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const normalizedDepartment = normalizeDepartment(department);
  const slug = slugifyRoleIdentity(trimmed, normalizedDepartment);
  const rows = await prisma.roleCatalog.findMany({
    where: {
      OR: [{ label: trimmed }, { slug }]
    },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  });

  const row =
    rows.find((candidate) => normalizeDepartment(candidate.department ?? undefined) === normalizedDepartment) ??
    rows[0];

  return row ? mapRole(row) : null;
}

export async function createRoleCatalogEntry(input: {
  label: string;
  department?: string;
}) {
  const label = input.label.trim();
  const department = normalizeDepartment(input.department);
  if (!label) {
    throw new Error("Role label is required.");
  }

  const existing = await findRoleCatalogEntryByLabel(label, department);
  if (existing) {
    return existing;
  }

  const last = await prisma.roleCatalog.findFirst({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: { sortOrder: true }
  });

  const created = await prisma.roleCatalog.create({
    data: {
      slug: slugifyRoleIdentity(label, department),
      label,
      department: department || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      isActive: true
    }
  });

  return mapRole(created);
}

export async function updateRoleCatalogEntry(
  roleId: string,
  input: {
    label: string;
    department?: string;
    isActive?: boolean;
  }
) {
  const label = input.label.trim();
  const department = normalizeDepartment(input.department);
  if (!label) {
    throw new Error("Role label is required.");
  }

  const duplicate = (
    await prisma.roleCatalog.findMany({
      where: {
        id: { not: roleId },
        label
      },
      select: { id: true, department: true }
    })
  ).find((candidate) => normalizeDepartment(candidate.department ?? undefined) === department);

  if (duplicate) {
    throw new Error("A role with that name already exists in that department.");
  }

  const updated = await prisma.roleCatalog.update({
    where: { id: roleId },
    data: {
      slug: slugifyRoleIdentity(label, department),
      label,
      department: department || null,
      isActive: input.isActive
    }
  });

  return mapRole(updated);
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
    prisma.candidate.count({ where: { roleId, intakeBucket: "pipeline" } })
  ]);
  return { openJobCount, pipelineCandidateCount };
}

export async function deleteRoleCatalogEntry(roleId: string) {
  await prisma.roleCatalog.delete({ where: { id: roleId } });
}
