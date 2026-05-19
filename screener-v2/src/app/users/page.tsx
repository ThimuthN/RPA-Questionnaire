import { SignalCard } from "@/components/primitives/SignalCard";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { AddUserModal } from "@/components/users/AddUserModal";
import { UsersTable } from "@/components/users/UsersTable";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { listAppUsers } from "@/lib/auth/app-auth";

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  await requireAdminPageSession("/users");

  const users = await listAppUsers();
  const params = await searchParams;

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const admins = users.filter((u) => u.role?.label === "System Admin" && u.isActive).length;

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Admin"
      title="Team"
      subtitle="Manage user access and interview capacity."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SignalCard label="Team members" value={totalUsers.toString()} tone="blue" />
          <SignalCard label="Active" value={activeUsers.toString()} tone="emerald" />
          <SignalCard label="Admins" value={admins.toString()} tone="amber" />
        </div>

        <StagePanel className="space-y-5">
          {params.created && (
            <NotificationBanner tone="success">
              User created successfully: {params.created}
            </NotificationBanner>
          )}

          {params.updated && (
            <NotificationBanner tone="success">
              User updated successfully: {params.updated}
            </NotificationBanner>
          )}

          {params.error && (
            <NotificationBanner tone="error">
              {params.error}
            </NotificationBanner>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Team members</h2>
              <p className="text-sm text-[color:var(--app-muted)]">Manage your hiring platform users.</p>
            </div>
            <AddUserModal />
          </div>

          <UsersTable users={users} />
        </StagePanel>
      </div>
    </SceneShell>
  );
}
