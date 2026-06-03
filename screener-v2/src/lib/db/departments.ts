import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { APP_ACTIONS } from "@/lib/auth/permissions";

function isKnownPermission(permission: string) {
  return APP_ACTIONS.includes(permission as (typeof APP_ACTIONS)[number]);
}

export type DepartmentRecord = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type DepartmentUserRecord = {
  id: string;
  name: string | null;
  email: string;
  roleId: string | null;
  role: { id: string; label: string; permissions: string[] } | null;
  permissionOverrides: Array<{ permission: string; action: string }>;
  permissionCount: number;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const listDepartmentsUncached = async (
  includeInactive = false
): Promise<DepartmentRecord[]> => {
  return prisma.department.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      sortOrder: true
    }
  });
};

export const listDepartments = unstable_cache(
  (includeInactive = false) => listDepartmentsUncached(includeInactive),
  ["departments"],
  { revalidate: 300, tags: ["departments"] }
);

export async function getDepartment(id: string): Promise<DepartmentRecord | null> {
  return prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      sortOrder: true
    }
  });
}

export async function listDepartmentUsers(departmentId: string): Promise<DepartmentUserRecord[]> {
  const users = await prisma.user.findMany({
    where: { departmentId, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      role: {
        select: {
          id: true,
          label: true,
          permissions: {
            select: {
              permission: true
            }
          }
        }
      },
      permissionOverrides: {
        select: {
          permission: true,
          action: true
        }
      }
    },
    orderBy: [{ name: "asc" }, { email: "asc" }]
  });

  return users.map((user) => {
    const rolePermissions = user.role?.permissions.map((item) => item.permission).filter(isKnownPermission) ?? [];
    const permissions = new Set(rolePermissions);
    const permissionOverrides = user.permissionOverrides.filter((override) => isKnownPermission(override.permission));
    permissionOverrides.forEach((override) => {
      if (override.action === "grant") {
        permissions.add(override.permission);
      } else if (override.action === "revoke") {
        permissions.delete(override.permission);
      }
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: user.role
        ? {
            id: user.role.id,
            label: user.role.label,
            permissions: rolePermissions
          }
        : null,
      permissionOverrides,
      permissionCount: permissions.size
    };
  });
}

export async function createDepartment(input: {
  name: string;
}): Promise<DepartmentRecord> {
  const slug = slugify(input.name);

  // Check if slug already exists
  const existing = await prisma.department.findUnique({
    where: { slug }
  });

  if (existing) {
    throw new Error(`Department with name "${input.name}" already exists.`);
  }

  const dept = await prisma.department.create({
    data: {
      name: input.name,
      slug,
      isActive: true,
      sortOrder: 0
    },
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      sortOrder: true
    }
  });

  revalidateTag("departments");
  return dept;
}

export async function updateDepartment(
  id: string,
  input: { name?: string; isActive?: boolean; sortOrder?: number }
): Promise<DepartmentRecord> {
  // If name is being changed, check new slug doesn't exist
  if (input.name) {
    const newSlug = slugify(input.name);
    const existing = await prisma.department.findFirst({
      where: {
        slug: newSlug,
        NOT: { id }
      }
    });

    if (existing) {
      throw new Error(`Department with name "${input.name}" already exists.`);
    }
  }

  const dept = await prisma.department.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name, slug: slugify(input.name) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder })
    },
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      sortOrder: true
    }
  });

  revalidateTag("departments");
  return dept;
}

export async function deleteDepartment(id: string): Promise<void> {
  // Guard: check if department has any active roles
  const roleCount = await prisma.roleCatalog.count({
    where: { departmentId: id, isActive: true }
  });

  if (roleCount > 0) {
    throw new Error(`Cannot delete department with ${roleCount} active role(s).`);
  }

  // Guard: check if department has any active users
  const userCount = await prisma.user.count({
    where: { departmentId: id, isActive: true }
  });

  if (userCount > 0) {
    throw new Error(`Cannot delete department with ${userCount} active user(s).`);
  }

  await prisma.department.delete({
    where: { id }
  });
  revalidateTag("departments");
}
