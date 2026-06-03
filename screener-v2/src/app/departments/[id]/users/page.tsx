import { StatusPill } from "@/components/primitives/StatusPill";
import { UserAvatarInitials } from "@/components/users/UserAvatarInitials";
import { AddUserModal } from "@/components/users/AddUserModal";
import { AssignUserToDeptModal } from "@/components/departments/AssignUserToDeptModal";
import { DepartmentUserActions } from "@/components/departments/DepartmentUserActions";
import { getDepartment, listDepartmentUsers } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function DepartmentUsersPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requirePageSession(`/departments/${id}/users`);
  const permResult = await requirePermissionForDepartment(session, "manage_users", id);
  if (!permResult.ok) {
    notFound();
  }

  const [department, users, roles] = await Promise.all([
    getDepartment(id),
    listDepartmentUsers(id),
    prisma.roleCatalog.findMany({
      where: { departmentId: id, isActive: true },
      select: {
        id: true,
        label: true,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-[color:var(--app-heading)]">Team</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            Manage workspace team members and assign access roles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {department.slug === "system" ? (
            <AddUserModal buttonLabel="Create platform user" defaultDepartmentId={id} />
          ) : null}
          <AssignUserToDeptModal departmentId={id} departmentName={department.name} />
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-center text-sm text-[color:var(--app-muted)]">
          No users assigned to this department yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Member</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email</th>
                  <th scope="col" className="px-4 py-3 font-medium">Role</th>
                  <th scope="col" className="px-4 py-3 font-medium">Permissions</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatarInitials name={user.name} email={user.email} size="md" />
                        <div>
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">
                            {user.name || "Unnamed"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">
                      <span className="truncate" title={user.email}>{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role ? (
                        <StatusPill label={user.role.label} tone="blue" />
                      ) : (
                        <span className="text-sm text-[color:var(--app-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">
                      {user.permissionCount} permission{user.permissionCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DepartmentUserActions
                        departmentId={id}
                        user={{
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          roleId: user.roleId,
                          rolePermissions: user.role?.permissions ?? [],
                          permissionOverrides: user.permissionOverrides
                        }}
                        roles={roles.map((role) => ({
                          id: role.id,
                          label: role.label,
                          permissions: role.permissions.map((permission) => permission.permission)
                        }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
