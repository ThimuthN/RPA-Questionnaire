import Link from "next/link";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { RoleCatalogSection } from "@/components/roles/RoleCatalogSection";
import { requirePageSession } from "@/lib/auth/guards";
import { getDepartment } from "@/lib/db/departments";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function DepartmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePageSession(`/departments/${id}`);

  const department = await getDepartment(id);
  if (!department) {
    notFound();
  }

  const [roles, userCount, openJobCount, activeCandidateCount, finalizedCandidateCount] = await Promise.all([
    prisma.roleCatalog.findMany({
      where: { departmentId: id, isActive: true },
      include: {
        permissions: {
          select: { permission: true }
        }
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.user.count({ where: { departmentId: id, isActive: true } }),
    prisma.jobPosting.count({ where: { role: { departmentId: id }, isOpen: true } }),
    prisma.candidate.count({ where: { departmentId: id, orgStage: "active" } }),
    prisma.candidate.count({ where: { departmentId: id, orgStage: "finalized" } })
  ]);

  const tabs = [
    { label: "Overview", href: `/departments/${id}`, active: true },
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

          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-5">
              {[
                ["Users", userCount],
                ["Roles", roles.length],
                ["Open jobs", openJobCount],
                ["Active candidates", activeCandidateCount],
                ["Finalized", finalizedCandidateCount]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">{label}</p>
                  <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{value}</p>
                </div>
              ))}
            </div>

            <RoleCatalogSection
              departmentId={id}
              initialRoles={roles.map((role) => ({
                id: role.id,
                label: role.label,
                departmentId: role.departmentId,
                departmentName: department.name,
                description: role.description ?? undefined,
                experienceLevel: role.experienceLevel ?? undefined,
                requirements: role.requirements ?? undefined,
                permissions: role.permissions.map((permission) => permission.permission),
                isActive: role.isActive
              }))}
            />
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
