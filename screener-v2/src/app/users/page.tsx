import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SignalCard } from "@/components/primitives/SignalCard";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { AddUserModal } from "@/components/users/AddUserModal";
import { UserAvatarInitials } from "@/components/users/UserAvatarInitials";
import { UserFilters } from "@/components/users/UserFilters";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { listAppUsers, type AppUserRow } from "@/lib/auth/app-auth";

function formatRelativeTime(date: Date | null): string {
  if (!date) return "Never";
  const now = new Date();
  const ms = now.getTime() - date.getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);

  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

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

          <UserFilters users={users} />

          <div className="overflow-hidden rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            {users.length === 0 ? (
              <p className="p-4 text-sm text-[color:var(--app-muted)]">No database-backed users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Member</th>
                      <th scope="col" className="px-4 py-3 font-medium">Email</th>
                      <th scope="col" className="px-4 py-3 font-medium">Role</th>
                      <th scope="col" className="px-4 py-3 font-medium">Department</th>
                      <th scope="col" className="px-4 py-3 font-medium">Status</th>
                      <th scope="col" className="px-4 py-3 font-medium">Last active</th>
                      <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-table-row-hover)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatarInitials name={user.name} email={user.email} size="md" />
                            <div className="space-y-0.5">
                              <p className="text-sm text-[color:var(--app-heading)]">{user.name || "Unnamed"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">
                          <span className="truncate" title={user.email}>{user.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill
                            label={user.role?.label || "—"}
                            tone="blue"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">
                          {user.dept?.name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill label={user.isActive ? "Active" : "Inactive"} tone={user.isActive ? "emerald" : "neutral"} />
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--app-muted)]">
                          {formatRelativeTime(user.lastLoginAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <AddUserModal mode="edit" user={user} />
                            {user.isActive ? (
                              <form action={`/api/users/${user.id}`} method="post" className="inline">
                                <input type="hidden" name="action" value="deactivate" />
                                <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                                  Deactivate
                                </Button>
                              </form>
                            ) : (
                              <form action={`/api/users/${user.id}`} method="post" className="inline">
                                <input type="hidden" name="action" value="reactivate" />
                                <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                                  Activate
                                </Button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
