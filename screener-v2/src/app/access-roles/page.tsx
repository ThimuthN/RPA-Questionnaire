import { requireAdminPageSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import AccessRolesClient from "@/components/admin/AccessRolesClient";

export default async function AccessRolesPage() {
  await requireAdminPageSession("/access-roles");

  const roles = await prisma.roleCatalog.findMany({
    where: { kind: "access_role", isActive: true },
    include: {
      permissions: { select: { permission: true } },
      _count: { select: { accessGrants: { where: { status: "active" } } } }
    },
    orderBy: [{ applicability: "desc" }, { label: "asc" }]
  });

  return <AccessRolesClient initialRoles={roles} />;
}
