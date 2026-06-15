import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { DepartmentAccessRolesSection } from "@/components/departments/DepartmentAccessRolesSection";
import { listAccessRoles } from "@/lib/roles/catalog";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";

export default async function DepartmentAccessPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requirePageSession(`/departments/${id}/access`);
  const canManageAccess = await canUsePermissionForDepartment(session, "manage_users", id);

  if (!canManageAccess) {
    notFound();
  }

  const [department, accessRoles] = await Promise.all([
    getDepartment(id),
    listAccessRoles({ departmentId: id, scope: "department" })
  ]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Access Control</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Manage workspace roles and control what each team member can do inside this department.
        </p>
      </div>

      <DepartmentAccessRolesSection
        departmentId={id}
        departmentName={department.name}
        initialRoles={accessRoles}
      />
    </div>
  );
}
