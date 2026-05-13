import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { AddUserModal } from "@/components/users/AddUserModal";
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

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Admin"
      title="User access"
      subtitle="Create and update internal access."
    >
      <div className="space-y-4">
        <StagePanel tone="summary">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Create user</h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                Grant access to new team members.
              </p>
            </div>
            <AddUserModal created={params.created} updated={params.updated} error={params.error} />
          </div>
        </StagePanel>

        <StagePanel tone="open" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Existing users</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Bootstrap admin access comes from env vars and is not listed here.</p>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            {users.length === 0 ? (
              <p className="p-4 text-sm text-[color:var(--app-muted)]">No database-backed users yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full table-fixed text-left">
                <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  <tr>
                    <th className="w-[22%] px-4 py-3 font-medium">Name</th>
                    <th className="w-[28%] px-4 py-3 font-medium">Email</th>
                    <th className="w-[14%] px-4 py-3 font-medium">Role</th>
                    <th className="w-[16%] px-4 py-3 font-medium">Created</th>
                    <th className="w-[20%] px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-table-row-hover)]">
                      <td className="px-4 py-3 text-[color:var(--app-heading)]">{user.name || "Unnamed user"}</td>
                      <td className="px-4 py-3 text-[color:var(--app-text)]">
                        <span className="block truncate" title={user.email}>{user.email}</span>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--app-text)] capitalize">{user.role}</td>
                      <td className="px-4 py-3 text-[color:var(--app-muted)]">
                        <span className="whitespace-nowrap" title={new Date(user.createdAt).toLocaleString()}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <form action={`/api/users/${user.id}`} method="post" className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <select
                            name="role"
                            defaultValue={user.role}
                            className="min-w-[110px] rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">Save</Button>
                        </form>
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
