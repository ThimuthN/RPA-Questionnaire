import { SignalCard } from "@/components/primitives/SignalCard";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { UserDirectory, type DirectoryUser } from "@/components/admin/UserDirectory";
import { listAccessRoles } from "@/lib/roles/catalog";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  const session = await requireAdminPageSession("/users");

  const [users, departments, systemRoles] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
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
      take: 200
    }),
    prisma.department.findMany({
      select: { id: true, slug: true, name: true },
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    }),
    listAccessRoles()
  ]);

  const total = users.length;
  const active = users.filter((u) => u.isActive).length;
  const systemAdmins = users.filter((u) => u.accessGrants.some((g) => g.scope === "system")).length;

  const directoryUsers: DirectoryUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    accessGrants: u.accessGrants
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">User Management</h1>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">
            Create users and manage system or workspace access.
          </p>
        </div>
        <CreateUserModal />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SignalCard label="Users" value={total.toString()} tone="blue" />
        <SignalCard label="Active" value={active.toString()} tone="emerald" />
        <SignalCard label="System admins" value={systemAdmins.toString()} tone="amber" />
      </div>

      <UserDirectory
        users={directoryUsers}
        departments={departments}
        systemRoles={systemRoles}
        currentUserId={session.userId}
      />
    </div>
  );
}
