import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { getDepartment } from "@/lib/db/departments";
import { JobsWorkspaceView } from "@/components/jobs/JobsWorkspaceView";
import { notFound } from "next/navigation";
import type { Route } from "next";

export const dynamic = "force-dynamic";

export default async function DepartmentJobsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePageSession(`/departments/${id}/jobs`);

  const [department, canCreateJob, canEditJob] = await Promise.all([
    getDepartment(id),
    canUsePermissionForDepartment(session, "create_job", id),
    canUsePermissionForDepartment(session, "edit_job", id)
  ]);

  if (!department) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Jobs</h2>
        <p className="mt-0.5 text-sm text-[color:var(--app-muted)]">
          Open positions for this workspace.
        </p>
      </div>

      <JobsWorkspaceView
        scope="department"
        departmentId={id}
        canCreateJob={canCreateJob}
        canEditJob={canEditJob}
        createJobHref={`/departments/${id}/jobs/new` as Route}
        applicantsBasePath={`/departments/${id}/applicants`}
        editJobBasePath={`/departments/${id}/jobs`}
        jobsBasePath={`/departments/${id}/jobs`}
      />
    </div>
  );
}
