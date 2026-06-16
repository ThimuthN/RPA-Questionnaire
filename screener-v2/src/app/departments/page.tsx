import { SignalCard } from "@/components/primitives/SignalCard";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { DepartmentModal } from "@/components/departments/DepartmentModal";
import { WorkspaceDirectory, type WorkspaceRow } from "@/components/departments/WorkspaceDirectory";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { listDepartments } from "@/lib/db/departments";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string }>;
}) {
  await requireAdminPageSession("/departments");

  // Departments + per-workspace counts in a few aggregate queries (no N+1 over 23 workspaces).
  const [departments, jobGroups, candidateGroups, grantGroups, params] = await Promise.all([
    listDepartments(true),
    prisma.jobPosting.groupBy({
      by: ["departmentId"],
      where: { departmentId: { not: null } },
      _count: { _all: true }
    }),
    prisma.candidate.groupBy({
      by: ["departmentId"],
      where: { departmentId: { not: null } },
      _count: { _all: true }
    }),
    prisma.accessGrant.groupBy({
      by: ["departmentId"],
      where: { scope: "department", status: "active", departmentId: { not: null } },
      _count: { _all: true }
    }),
    searchParams
  ]);

  const jobMap = new Map(jobGroups.map((g) => [g.departmentId!, g._count._all]));
  const candidateMap = new Map(candidateGroups.map((g) => [g.departmentId!, g._count._all]));
  const grantMap = new Map(grantGroups.map((g) => [g.departmentId!, g._count._all]));

  const workspaces: WorkspaceRow[] = departments.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    isActive: d.isActive,
    sortOrder: d.sortOrder,
    jobs: jobMap.get(d.id) ?? 0,
    candidates: candidateMap.get(d.id) ?? 0,
    members: grantMap.get(d.id) ?? 0
  }));

  const totalDepartments = workspaces.length;
  const activeDepartments = workspaces.filter((w) => w.isActive).length;
  const totalJobs = workspaces.reduce((sum, w) => sum + w.jobs, 0);
  const totalCandidates = workspaces.reduce((sum, w) => sum + w.candidates, 0);

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Admin"
      title="Manage Workspaces"
      subtitle="Create, activate, and manage hiring workspaces and their configuration."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SignalCard label="Workspaces" value={`${activeDepartments}/${totalDepartments}`} tone="blue" />
          <SignalCard label="Active" value={activeDepartments.toString()} tone="emerald" />
          <SignalCard label="Open roles" value={totalJobs.toString()} tone="blue" />
          <SignalCard label="Candidates" value={totalCandidates.toString()} tone="blue" />
        </div>

        <StagePanel className="space-y-5">
          {params.created && (
            <NotificationBanner tone="success">Workspace created: {params.created}</NotificationBanner>
          )}
          {params.updated && (
            <NotificationBanner tone="success">Workspace updated: {params.updated}</NotificationBanner>
          )}
          {params.deleted && <NotificationBanner tone="success">Workspace deleted.</NotificationBanner>}
          {params.error && <NotificationBanner tone="error">{params.error}</NotificationBanner>}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Workspace directory</h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                Each workspace is a hiring department or operating unit — separate jobs, candidates, assessments, teams, and access.
              </p>
            </div>
            <DepartmentModal />
          </div>

          <WorkspaceDirectory workspaces={workspaces} />
        </StagePanel>
      </div>
    </SceneShell>
  );
}
