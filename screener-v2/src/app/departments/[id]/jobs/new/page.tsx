import Link from "next/link";
import type { Route } from "next";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { JobPostingForm } from "@/components/jobs/JobPostingForm";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { isSystemAdmin } from "@/lib/auth/permission-evaluator";
import { getDepartment } from "@/lib/db/departments";
import { listRoleCatalog } from "@/lib/roles/catalog";
import { listAssessmentPresets } from "@/lib/addons/catalog";

export default async function DepartmentNewJobPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { id } = await params;
  const pageState = await searchParams;

  const session = await requirePageSession(`/departments/${id}/jobs/new`);
  const sysAdmin = session.userId ? await isSystemAdmin(session.userId) : false;
  if (!sysAdmin && !session.permissions.includes("create_job")) {
    redirect(`/departments/${id}/jobs`);
  }

  const department = await getDepartment(id);
  if (!department) {
    notFound();
  }

  // Load job designations scoped to this department only
  const [roles, presets] = await Promise.all([
    listRoleCatalog(true, id, "job_designation"),
    listAssessmentPresets({ departmentId: id, includeShared: true })
  ]);
  const returnTo = `/departments/${id}/jobs`;

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow={department.name}
      title="New job"
      subtitle="Create a job opening for this workspace."
      utility={
        <Link href={`/departments/${id}/jobs` as Route}>
          <Button variant="secondary">Back to jobs</Button>
        </Link>
      }
    >
      <div className="space-y-5">
        <StagePanel className="max-w-3xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Create a job</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              This creates the internal record and the public page when published.
            </p>
          </div>
          <JobPostingForm
            action="/api/jobs"
            submitLabel="Create job"
            cancelHref={`/departments/${id}/jobs` as Route}
            returnTo={returnTo}
            departmentId={id}
            initialError={pageState.error}
            roleOptions={roles.map((role) => ({
              id: role.id,
              label: role.label,
              department: role.department,
              isActive: role.isActive
            }))}
            presetOptions={presets.map((preset) => ({
              id: preset.id,
              label: preset.label
            }))}
          />
        </StagePanel>
      </div>
    </SceneShell>
  );
}
