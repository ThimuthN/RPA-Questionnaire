import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export type DepartmentRecord = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type DepartmentDetail = DepartmentRecord;

export type DepartmentUserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: { id: string; label: string } | null;
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

export async function getDepartmentDetail(id: string): Promise<DepartmentDetail | null> {
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
      role: {
        select: {
          id: true,
          label: true
        }
      },
      permissionOverrides: {
        select: {
          action: true
        }
      }
    },
    orderBy: [{ name: "asc" }, { email: "asc" }]
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissionCount: user.permissionOverrides?.length ?? 0
  }));
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
