import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { requirePermissionForDepartment } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import DepartmentAccessClient from "@/components/departments/DepartmentAccessClient";
import { listAccessRoles } from "@/lib/roles/catalog";

export default async function DepartmentAccessPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requirePageSession(`/departments/${id}/access`);
  const permResult = await requirePermissionForDepartment(session, "manage_users", id);
  if (!permResult.ok) {
    notFound();
  }

  const [department, accessRoles] = await Promise.all([
    getDepartment(id),
    listAccessRoles({
      departmentId: id,
      scope: "department"
    })
  ]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">Access Control</h1>
          <p className="text-sm text-[color:var(--app-muted)] mt-1">
            Manage workspace access roles and permissions.
          </p>
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
        <h3 className="font-medium text-[color:var(--app-heading)] mb-2">Access Roles</h3>
        <p className="text-sm text-[color:var(--app-muted)]">
          Access roles control what users can do in this workspace. Assign roles from Team or User Management. Job designations classify jobs and candidates.
        </p>
      </div>

      <DepartmentAccessClient
        departmentId={id}
        departmentName={department.name}
        initialRoles={accessRoles}
      />
    </div>
  );
}
