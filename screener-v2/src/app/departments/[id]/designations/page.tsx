import { RoleCatalogSection } from "@/components/roles/RoleCatalogSection";
import { getDepartment } from "@/lib/db/departments";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function DepartmentDesignationsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [department, roles] = await Promise.all([
    getDepartment(id),
    prisma.roleCatalog.findMany({
      where: { departmentId: id, isActive: true, kind: "job_designation" },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  if (!department) {
    notFound();
  }

  // Designations page shows only job_designation kind
  const jobDesignations = roles;

  return (
    <RoleCatalogSection
      departmentId={id}
      initialRoles={jobDesignations.map((role) => ({
        id: role.id,
        label: role.label,
        departmentId: role.departmentId,
        departmentName: department.name,
        description: role.description ?? undefined,
        experienceLevel: role.experienceLevel ?? undefined,
        requirements: role.requirements ?? undefined,
        permissions: [],
        isActive: role.isActive
      }))}
    />
  );
}
