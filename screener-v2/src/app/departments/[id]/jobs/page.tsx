import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { DataTable } from "@/components/primitives/DataTable";
import { getDepartment } from "@/lib/db/departments";
import { listJobPostings } from "@/lib/db/jobs";
import type { JobPostingListItem } from "@/lib/jobs/types";
import { notFound } from "next/navigation";

function nextJobAction(job: JobPostingListItem) {
  if (!job.isPublished) return "Publish job";
  if (!job.isOpen) return "Open applications";
  if (job.applicantCount > 0) return "Review applicants";
  return "Wait for applicants";
}

export default async function DepartmentJobsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [department, jobs] = await Promise.all([
    getDepartment(id),
    listJobPostings(id)
  ]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-[color:var(--app-heading)]">Job Openings</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            Manage job posts and review applicant queue.
          </p>
        </div>
        <Link href="/people/candidates/jobs/new">
          <Button>Create job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-center text-sm text-[color:var(--app-muted)]">
          No jobs yet. Create one to start hiring.
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: "Job",
              width: "w-[26%]",
              render: (job) => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{job.title}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">{job.roleLabel || "No role linked"}</p>
                </div>
              )
            },
            {
              header: "Summary",
              width: "w-[18%]",
              render: (job) => <p className="text-sm text-[color:var(--app-text)]">{job.summary}</p>
            },
            {
              header: "Applicants",
              width: "w-[14%]",
              render: (job) => (
                <Link
                  href={`/departments/${id}/applicants?jobId=${job.id}`}
                  className="text-[color:var(--app-brand)] hover:underline"
                >
                  {job.applicantCount}
                </Link>
              )
            },
            {
              header: "Status",
              width: "w-[16%]",
              render: (job) => (
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={job.isPublished ? "Published" : "Draft"} tone={job.isPublished ? "emerald" : "neutral"} />
                  <StatusPill label={job.isOpen ? "Open" : "Closed"} tone={job.isOpen ? "blue" : "amber"} />
                </div>
              )
            },
            {
              header: "Next action",
              width: "w-[14%]",
              render: (job) => <p className="text-sm font-medium text-[color:var(--app-heading)]">{nextJobAction(job)}</p>
            },
            {
              header: "Updated",
              width: "w-[10%]",
              render: (job) => <p className="text-sm text-[color:var(--app-muted)]">{new Date(job.updatedAt).toLocaleDateString()}</p>
            }
          ]}
          data={jobs}
          emptyMessage="No jobs yet."
        />
      )}
    </div>
  );
}
