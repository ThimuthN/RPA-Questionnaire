import type { RoleId } from "@/lib/assessment-engine/types";
import { prisma } from "@/lib/db/prisma";

export interface RoleCatalogEntry {
  id: string;
  slug: string;
  label: string;
  department?: string;
  sortOrder: number;
  isActive: boolean;
  coreBasisRoleId: RoleId;
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
  department?: string | null;
  sortOrder: number;
  isActive: boolean;
  coreBasisRoleId: string;
}): RoleCatalogEntry {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    department: row.department ?? undefined,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    coreBasisRoleId: row.coreBasisRoleId as RoleId
  };
}

export async function listRoleCatalog(includeInactive = false): Promise<RoleCatalogEntry[]> {
  const rows = await prisma.roleCatalog.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
  });

  return rows.map(mapRole);
}

export async function getRoleCatalogEntry(roleId: string) {
  const row = await prisma.roleCatalog.findUnique({
    where: { id: roleId }
  });

  return row ? mapRole(row) : null;
}

export async function findRoleCatalogEntryByLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const slug = slugifyRoleLabel(trimmed);
  const row = await prisma.roleCatalog.findFirst({
    where: {
      OR: [{ label: trimmed }, { slug }]
    }
  });

  return row ? mapRole(row) : null;
}

export async function createRoleCatalogEntry(input: {
  label: string;
  department?: string;
  coreBasisRoleId?: RoleId;
}) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Role label is required.");
  }

  const existing = await findRoleCatalogEntryByLabel(label);
  if (existing) {
    return existing;
  }

  const last = await prisma.roleCatalog.findFirst({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: { sortOrder: true }
  });

  const created = await prisma.roleCatalog.create({
    data: {
      slug: slugifyRoleLabel(label),
      label,
      department: input.department?.trim() || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      isActive: true,
      coreBasisRoleId: input.coreBasisRoleId ?? "Associate"
    }
  });

  return mapRole(created);
}

export async function updateRoleCatalogEntry(
  roleId: string,
  input: {
    label: string;
    department?: string;
    coreBasisRoleId?: RoleId;
    isActive?: boolean;
  }
) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Role label is required.");
  }

  const duplicate = await prisma.roleCatalog.findFirst({
    where: {
      id: { not: roleId },
      OR: [{ label }, { slug: slugifyRoleLabel(label) }]
    },
    select: { id: true }
  });

  if (duplicate) {
    throw new Error("A role with that name already exists.");
  }

  const updated = await prisma.roleCatalog.update({
    where: { id: roleId },
    data: {
      slug: slugifyRoleLabel(label),
      label,
      department: input.department?.trim() || null,
      coreBasisRoleId: input.coreBasisRoleId,
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
  defaultCoreBasisRoleId?: RoleId;
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
    label,
    coreBasisRoleId: input.defaultCoreBasisRoleId ?? "Associate"
  });
}
