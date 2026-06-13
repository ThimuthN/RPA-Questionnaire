import Link from "next/link";
import type { Route } from "next";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { DropdownMenu } from "@/components/primitives/DropdownMenu";
import { DataTable } from "@/components/primitives/DataTable";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { getDepartment } from "@/lib/db/departments";
import { listJobPostings } from "@/lib/db/jobs";
import { notFound } from "next/navigation";

export default async function DepartmentJobsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePageSession(`/departments/${id}/jobs`);

  const [department, jobs, canCreateJob, canEditJob] = await Promise.all([
    getDepartment(id),
    listJobPostings(id),
    canUsePermissionForDepartment(session, "create_job", id),
    canUsePermissionForDepartment(session, "edit_job", id)
  ]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-[color:var(--app-heading)]">Jobs</h2>
          <p className="mt-0.5 text-sm text-[color:var(--app-muted)]">
            Open positions for this department.
          </p>
        </div>
        {canCreateJob ? (
          <Link href={`/departments/${id}/jobs/new` as Route}>
            <Button>Create job</Button>
          </Link>
        ) : null}
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-6 py-10 text-center">
          <p className="text-sm text-[color:var(--app-muted)]">No jobs yet. Create one to start hiring.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: "Job",
              width: "w-[35%]",
              render: (job) => (
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-[color:var(--app-heading)]">{job.title}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">
                    {job.roleLabel || "—"}
                  </p>
                </div>
              )
            },
            {
              header: "Status",
              width: "w-[25%]",
              render: (job) => (
                <div className="flex flex-wrap gap-1.5">
                  <StatusPill
                    label={job.isPublished ? "Published" : "Draft"}
                    tone={job.isPublished ? "emerald" : "neutral"}
                  />
                  <StatusPill
                    label={job.isOpen ? "Open" : "Closed"}
                    tone={job.isOpen ? "blue" : "amber"}
                  />
                </div>
              )
            },
            {
              header: "Applicants",
              width: "w-[12%]",
              render: (job) => (
                <Link
                  href={`/departments/${id}/applicants?jobId=${job.id}`}
                  className="text-sm font-medium text-[color:var(--app-brand)] hover:underline"
                >
                  {job.applicantCount}
                </Link>
              )
            },
            {
              header: "Action",
              width: "w-[28%]",
              render: (job) => {
                const dropdownItems = [
                  ...(job.isPublished
                    ? [
                        {
                          label: "View public page",
                          href: `/jobs/${job.slug}` as Route
                        }
                      ]
                    : []),
                  ...(canEditJob
                    ? [
                        {
                          label: "Edit job",
                          href: `/departments/${id}/jobs/${job.id}` as Route
                        }
                      ]
                    : [])
                ];

                return (
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/departments/${id}/applicants?jobId=${job.id}` as Route}>
                      <Button type="button" className="px-3 py-1.5 text-sm">
                        Review
                      </Button>
                    </Link>
                    {dropdownItems.length > 0 ? (
                      <DropdownMenu items={dropdownItems} trigger={<MoreVertical className="h-4 w-4" />} />
                    ) : null}
                  </div>
                );
              }
            }
          ]}
          data={jobs}
          emptyMessage="No jobs yet."
        />
      )}
    </div>
  );
}
