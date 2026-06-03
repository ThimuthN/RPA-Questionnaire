import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

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

  const [department, roles] = await Promise.all([
    getDepartment(id),
    prisma.roleCatalog.findMany({
      where: { departmentId: id, isActive: true, kind: "access_role" },
      select: {
        id: true,
        label: true,
        kind: true,
        permissions: {
          select: { permission: true }
        }
      },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  if (!department) {
    notFound();
  }

  // Access page shows only access_role kind
  const accessRoles = roles;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Access Control</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Manage department access roles and permissions.
        </p>
      </div>

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
        <h3 className="font-medium text-[color:var(--app-heading)] mb-2">Department Access Roles</h3>
        <p className="text-sm text-[color:var(--app-muted)]">
          Access roles control what department users can do. Team members in this department are assigned an access role to grant them specific permissions.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[color:var(--app-heading)] mb-4">Access Roles</h3>
        {accessRoles.length === 0 ? (
          <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-center space-y-3">
            <p className="text-sm text-[color:var(--app-muted)]">
              No access roles configured for this workspace yet.
            </p>
            <p className="text-xs text-[color:var(--app-muted)]">
              Create default access roles or add custom roles from the Admin section.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Role</th>
                    <th scope="col" className="px-4 py-3 font-medium">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessRoles.map((role) => (
                    <tr key={role.id} className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]">
                      <td className="px-4 py-3 text-sm font-medium text-[color:var(--app-heading)]">
                        {role.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">
                        {role.permissions.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
