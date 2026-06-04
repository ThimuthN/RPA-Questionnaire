import { requireAdminPageSession } from "@/lib/auth/guards";
import AccessRolesClient from "@/components/admin/AccessRolesClient";
import { listAccessRoles } from "@/lib/roles/catalog";

export default async function AccessRolesPage() {
  await requireAdminPageSession("/access-roles");

  const roles = await listAccessRoles();

  return <AccessRolesClient initialRoles={roles} />;
}
