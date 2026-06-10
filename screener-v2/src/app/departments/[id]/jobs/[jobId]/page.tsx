import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { JobPostingEditorContent } from "@/components/jobs/JobPostingEditorContent";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { listAssessmentPresets } from "@/lib/addons/catalog";
import { getDepartment } from "@/lib/db/departments";
import { getJobPosting } from "@/lib/db/jobs";
import { listRoleCatalog } from "@/lib/roles/catalog";

export default async function DepartmentEditJobPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; jobId: string }>;
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const { id, jobId } = await params;
  const pageState = await searchParams;
  const session = await requirePageSession(`/departments/${id}/jobs/${jobId}`);

  const [department, job, roles, presets, canEditJob] = await Promise.all([
    getDepartment(id),
    getJobPosting(jobId),
    listRoleCatalog(true, id, "job_designation"),
    listAssessmentPresets({ departmentId: id, includeShared: true }),
    canUsePermissionForDepartment(session, "edit_job", id)
  ]);

  if (!department) {
    notFound();
  }

  if (!job || job.departmentId !== id) {
    notFound();
  }

  if (!canEditJob) {
    redirect(`/departments/${id}/jobs`);
  }

  const jobsHref = `/departments/${id}/jobs` as Route;
  const editorHref = `/departments/${id}/jobs/${job.id}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl text-[color:var(--app-heading)]">{job.title}</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            Edit this job inside the {department.name} workspace.
          </p>
        </div>
        <Link href={jobsHref}>
          <Button variant="secondary">Back to jobs</Button>
        </Link>
      </div>

      <JobPostingEditorContent
        job={job}
        pageState={pageState}
        cancelHref={jobsHref}
        editorHref={editorHref}
        applicantListHref={`/departments/${id}/applicants?jobId=${job.id}` as Route}
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
        departmentId={id}
      />
    </div>
  );
}
