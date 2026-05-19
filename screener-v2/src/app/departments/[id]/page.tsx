import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { RoleCatalogSection } from "@/components/roles/RoleCatalogSection";
import { requirePageSession } from "@/lib/auth/guards";
import { getDepartmentDetail } from "@/lib/db/departments";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function DepartmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePageSession(`/departments/${id}`);

  const department = await getDepartmentDetail(id);
  if (!department) {
    notFound();
  }

  // Fetch roles for this department
  const roles = await prisma.roleCatalog.findMany({
    where: { departmentId: id, isActive: true },
    orderBy: { sortOrder: "asc" }
  });

  const tabs = [
    { label: "Roles", href: `/departments/${id}`, active: true },
    { label: "Users", href: `/departments/${id}/users`, active: false }
  ];

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Admin"
      title={department.name}
      subtitle="Manage department roles and team members."
    >
      <div className="space-y-6">
        <StagePanel className="space-y-5">
          <div className="border-b border-[color:var(--app-border)]">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href as any}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                    tab.active
                      ? "border-brand text-[color:var(--app-heading)]"
                      : "border-transparent text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">
                Department Roles
              </h3>
              <p className="text-sm text-[color:var(--app-muted)]">
                {roles.length} role{roles.length !== 1 ? "s" : ""}
              </p>
            </div>

            {roles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface)]/50 p-8 text-center">
                <p className="text-sm text-[color:var(--app-muted)]">No roles defined for this department yet.</p>
                <p className="mt-2 text-xs text-[color:var(--app-muted)]">Roles can be created from the main Roles admin page.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-medium">Role</th>
                        <th scope="col" className="px-4 py-3 font-medium">Sort Order</th>
                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                        <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id} className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]">
                          <td className="px-4 py-3 font-medium text-[color:var(--app-heading)]">{role.label}</td>
                          <td className="px-4 py-3 text-[color:var(--app-text)]">{role.sortOrder}</td>
                          <td className="px-4 py-3">
                            <StatusPill label="Active" tone="emerald" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" className="text-xs px-2 py-1">
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
