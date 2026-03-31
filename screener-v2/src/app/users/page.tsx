import { Button } from "@/components/primitives/Button";
import { RolePicker } from "@/components/roles/RolePicker";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
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
        <StagePanel tone="summary" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Roles</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              Add and manage the roles you want to use when registering candidates.
            </p>
          </div>
          <div className="max-w-xl">
            <RolePicker
              label="Role catalog"
              placeholder="Select a role"
              helperText="Create, rename, group by department, or deactivate roles."
            />
          </div>
        </StagePanel>

        <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <StagePanel tone="summary" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Add user</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Admins can add internal users here.</p>
          </div>

          <form action="/api/users" method="post" className="space-y-3">
            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="Internal user"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {params.created ? <p className="text-sm text-[color:var(--app-success)]">Created {params.created}.</p> : null}
            {params.updated ? <p className="text-sm text-[color:var(--app-success)]">Updated {params.updated}.</p> : null}
            {params.error ? <p className="text-sm text-[color:var(--app-danger)]">{params.error}</p> : null}
            <Button type="submit">Create user</Button>
          </form>
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
      </div>
    </SceneShell>
  );
}
