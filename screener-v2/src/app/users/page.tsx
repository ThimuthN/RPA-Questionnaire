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
      eyebrow="Admin"
      title="User access"
      subtitle="Create and review internal accounts for assessment management."
    >
      <div className="space-y-4">
        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Roles</h2>
            <p className="text-sm text-slate-300">
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

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Create user</h2>
            <p className="text-sm text-slate-300">Admins can add more internal users here.</p>
          </div>

          <form action="/api/users" method="post" className="space-y-3">
            <div className="grid gap-1">
              <label className="text-sm text-slate-200" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="Internal user"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-slate-200" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-slate-200" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {params.created ? <p className="text-sm text-emerald-200">Created {params.created}.</p> : null}
            {params.updated ? <p className="text-sm text-emerald-200">Updated {params.updated}.</p> : null}
            {params.error ? <p className="text-sm text-red-200">{params.error}</p> : null}
            <Button type="submit">Create user</Button>
          </form>
        </StagePanel>

        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Existing users</h2>
            <p className="text-sm text-slate-300">Bootstrap admin access comes from env vars and is not listed here.</p>
          </div>

          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-slate-300">No database-backed users yet.</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-[18px] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-base text-white">{user.name || "Unnamed user"}</p>
                      <p className="text-sm text-slate-300">{user.email}</p>
                    </div>
                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="text-sm text-slate-300 lg:text-right">
                        <p className="capitalize text-white">{user.role}</p>
                        <p>{new Date(user.createdAt).toLocaleString()}</p>
                      </div>
                      <form action={`/api/users/${user.id}`} method="post" className="flex flex-wrap items-center gap-2">
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-[16px] border border-white/16 bg-white/[0.05] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button type="submit" variant="secondary">Save role</Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </StagePanel>
        </div>
      </div>
    </SceneShell>
  );
}
