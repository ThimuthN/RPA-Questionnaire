import { StatusPill } from "@/components/primitives/StatusPill";
import { UserAvatarInitials } from "@/components/users/UserAvatarInitials";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { GrantAccessModal } from "@/components/admin/GrantAccessModal";

export default async function UserManagementPage() {
  await requireAdminPageSession("/users");

  const [users, departments, systemRoles] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        accessGrants: {
          where: { status: "active" },
          select: {
            scope: true,
            role: { select: { slug: true, label: true } },
            department: { select: { name: true } }
          }
        }
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      take: 100
    }),
    prisma.department.findMany({
      select: { id: true, slug: true, name: true },
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.roleCatalog.findMany({
      where: {
        departmentId: (await prisma.department.findFirst({ where: { slug: "system" } }))?.id,
        kind: "access_role",
        isActive: true
      },
      select: { id: true, label: true, slug: true },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">User Management</h1>
        <p className="text-sm text-[color:var(--app-muted)] mt-1">
          Create users and manage system or workspace access.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search users by name or email..."
          className="flex-1 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
        <CreateUserModal />
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-8 text-center">
          <p className="text-sm text-[color:var(--app-muted)]">No users yet.</p>
          <p className="text-xs text-[color:var(--app-muted)] mt-1">Create your first user to get started.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-wider text-[color:var(--app-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Access Grants</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatarInitials name={user.name} email={user.email} size="md" />
                        <span className="text-sm font-medium text-[color:var(--app-heading)]">
                          {user.name || "Unnamed"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">{user.email}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={user.isActive ? "Active" : "Inactive"}
                        tone={user.isActive ? "emerald" : "neutral"}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">
                      {user.accessGrants.length === 0 ? (
                        <span className="text-[color:var(--app-muted)]">—</span>
                      ) : (
                        <span>{user.accessGrants.length}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <GrantAccessModal
                        userId={user.id}
                        userName={user.name || user.email}
                        departments={departments.filter((d) => d.slug !== "system")}
                        systemRoles={systemRoles}
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
