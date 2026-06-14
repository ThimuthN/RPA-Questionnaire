import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { DataTable } from "@/components/primitives/DataTable";
import { listJobPostings } from "@/lib/db/jobs";
import type { JobPostingListItem } from "@/lib/jobs/types";

function nextJobAction(job: JobPostingListItem) {
  if (!job.isPublished) return "Publish to receive applicants";
  if (!job.isOpen) return "Re-open applications";
  if (job.applicantCount > 0) return "Review applicants";
  return "Awaiting applicants";
}

function JobStatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5">
      <span className="text-xl font-semibold leading-none text-[color:var(--app-heading)]">{value}</span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{label}</span>
    </div>
  );
}

export async function JobsWorkspaceView({
  scope,
  departmentId,
  canCreateJob,
  canEditJob,
  createJobHref,
  applicantsBasePath,
  editJobBasePath,
  notice,
}: {
  scope: "global" | "department";
  departmentId?: string;
  canCreateJob: boolean;
  canEditJob: boolean;
  createJobHref: Route;
  applicantsBasePath: string;
  editJobBasePath: string;
  notice?: React.ReactNode;
}) {
  const jobs = await listJobPostings(departmentId);

  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicantCount, 0);

  return (
    <div className="space-y-5">
      {notice}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-[color:var(--app-muted)]">
            {scope === "department"
              ? "Open positions for this workspace."
              : "All job openings across hiring workspaces."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-shrink-0 items-center divide-x divide-[color:var(--app-border)] rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            <JobStatCell label="Total" value={jobs.length} />
            <JobStatCell label="Published" value={jobs.filter((j) => j.isPublished).length} />
            <JobStatCell label="Applicants" value={totalApplicants} />
          </div>
          {canCreateJob ? (
            <Link href={createJobHref}>
              <Button>Add job</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-6 py-12 text-center">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">No jobs yet</p>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">Create a job posting to start receiving applicants.</p>
          {canCreateJob ? (
            <div className="mt-4">
              <Link href={createJobHref}>
                <Button>Create first job</Button>
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: "Job",
              width: "w-[28%]",
              render: (job) => (
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{job.title}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">{job.roleLabel || "No role assigned"}</p>
                </div>
              )
            },
            {
              header: "Status",
              width: "w-[16%]",
              render: (job) => (
                <div className="flex flex-wrap gap-1.5">
                  <StatusPill label={job.isPublished ? "Published" : "Draft"} tone={job.isPublished ? "emerald" : "neutral"} />
                  <StatusPill label={job.isOpen ? "Open" : "Closed"} tone={job.isOpen ? "blue" : "amber"} />
                </div>
              )
            },
            {
              header: "Applicants",
              width: "w-[12%]",
              render: (job) => (
                <Link
                  href={`${applicantsBasePath}?jobId=${job.id}` as Route}
                  className="text-sm font-medium text-[color:var(--app-brand)] hover:underline"
                >
                  {job.applicantCount}
                </Link>
              )
            },
            {
              header: "Next action",
              width: "w-[20%]",
              render: (job) => (
                <p className="text-sm text-[color:var(--app-muted)]">{nextJobAction(job)}</p>
              )
            },
            {
              header: "Updated",
              width: "w-[10%]",
              render: (job) => (
                <p className="text-sm text-[color:var(--app-muted)]">{new Date(job.updatedAt).toLocaleDateString()}</p>
              )
            },
            {
              header: "Actions",
              width: "w-[14%]",
              render: (job) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link href={`${applicantsBasePath}?jobId=${job.id}` as Route}>
                    <Button type="button">Review</Button>
                  </Link>
                  {job.isPublished ? (
                    <Link href={`/jobs/${job.slug}` as Route}>
                      <Button type="button" variant="secondary">Public page</Button>
                    </Link>
                  ) : null}
                  {canEditJob ? (
                    <>
                      <form action={`/api/jobs/${job.id}`} method="post">
                        <input type="hidden" name="action" value="toggle_published" />
                        <Button type="submit" variant="ghost">
                          {job.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                      </form>
                      <form action={`/api/jobs/${job.id}`} method="post">
                        <input type="hidden" name="action" value="toggle_open" />
                        <Button type="submit" variant="ghost">
                          {job.isOpen ? "Close" : "Open"}
                        </Button>
                      </form>
                      <Link href={`${editJobBasePath}/${job.id}` as Route}>
                        <Button type="button" variant="secondary">Edit</Button>
                      </Link>
                    </>
                  ) : null}
                </div>
              )
            }
          ]}
          data={jobs}
          emptyMessage="No jobs yet."
        />
      )}
    </div>
  );
}
