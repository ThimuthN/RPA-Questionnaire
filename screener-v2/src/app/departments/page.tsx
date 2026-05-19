import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SignalCard } from "@/components/primitives/SignalCard";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { DepartmentModal } from "@/components/departments/DepartmentModal";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { listDepartments } from "@/lib/db/departments";

export default async function DepartmentsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string }>;
}) {
  await requireAdminPageSession("/departments");

  const departments = await listDepartments(true);
  const params = await searchParams;

  const totalDepartments = departments.length;
  const activeDepartments = departments.filter((d) => d.isActive).length;

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Admin"
      title="Departments"
      subtitle="Manage hiring departments and their assignments."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SignalCard label="Total" value={totalDepartments.toString()} tone="blue" />
          <SignalCard label="Active" value={activeDepartments.toString()} tone="emerald" />
          <SignalCard label="Inactive" value={(totalDepartments - activeDepartments).toString()} tone="amber" />
        </div>

        <StagePanel className="space-y-5">
          {params.created && (
            <NotificationBanner tone="success">
              Department created successfully: {params.created}
            </NotificationBanner>
          )}

          {params.updated && (
            <NotificationBanner tone="success">
              Department updated successfully: {params.updated}
            </NotificationBanner>
          )}

          {params.deleted && (
            <NotificationBanner tone="success">
              Department deleted successfully.
            </NotificationBanner>
          )}

          {params.error && (
            <NotificationBanner tone="error">
              {params.error}
            </NotificationBanner>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Departments</h2>
              <p className="text-sm text-[color:var(--app-muted)]">Manage your organization&apos;s departments.</p>
            </div>
            <DepartmentModal />
          </div>

          <div className="overflow-hidden rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            {departments.length === 0 ? (
              <p className="p-4 text-sm text-[color:var(--app-muted)]">No departments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Name</th>
                      <th scope="col" className="px-4 py-3 font-medium">Slug</th>
                      <th scope="col" className="px-4 py-3 font-medium">Status</th>
                      <th scope="col" className="px-4 py-3 font-medium">Sort Order</th>
                      <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department) => (
                      <tr
                        key={department.id}
                        className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-table-row-hover)]"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">{department.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--app-muted)]">
                          <code className="text-xs font-mono">{department.slug}</code>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill
                            label={department.isActive ? "Active" : "Inactive"}
                            tone={department.isActive ? "emerald" : "neutral"}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--app-text)]">{department.sortOrder}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DepartmentModal mode="edit" department={department} />
                            {department.isActive ? (
                              <form action={`/api/departments/${department.id}`} method="post" className="inline">
                                <input type="hidden" name="action" value="deactivate" />
                                <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                                  Deactivate
                                </Button>
                              </form>
                            ) : (
                              <form action={`/api/departments/${department.id}`} method="post" className="inline">
                                <input type="hidden" name="action" value="activate" />
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
