import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { DataTable } from "@/components/primitives/DataTable";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { requirePageSession } from "@/lib/auth/guards";
import { listJobPostings } from "@/lib/db/jobs";
import type { JobPostingListItem } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

function NoticeBanner({
  tone,
  children
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const className =
    tone === "success"
      ? "rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success)]/10 p-4 text-sm text-white"
      : "rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger)]/10 p-4 text-sm text-white";

  return <div className={className}>{children}</div>;
}

function nextJobAction(job: JobPostingListItem) {
  if (!job.isPublished) return "Publish job";
  if (!job.isOpen) return "Open applications";
  if (job.applicantCount > 0) return "Review applicants";
  return "Wait for applicants";
}

export default async function CandidateJobsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const session = await requirePageSession("/people/candidates/jobs");
  const pageState = await searchParams;
  const jobs = await listJobPostings();
  const canCreateJob = session.permissions.includes("create_job");
  const canEditJob = session.permissions.includes("edit_job");

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Hiring"
      title="Jobs"
      subtitle="Manage job openings, public availability, and applicant intake."
      utility={
        <div className="flex flex-wrap items-center gap-2">
          <PeopleViewSwitch current="candidates" />
          {canCreateJob ? (
            <Link href="/people/candidates/jobs/new">
              <Button>Add job</Button>
            </Link>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5">
        <CandidatesViewSwitch current="jobs" />

        {pageState.created || pageState.updated || pageState.error ? (
          <div className="space-y-2">
            {pageState.created ? <NoticeBanner tone="success">Job created.</NoticeBanner> : null}
            {pageState.updated ? <NoticeBanner tone="success">Job updated.</NoticeBanner> : null}
            {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-[color:var(--app-muted)]">
              Open positions and their applicant queues.
            </p>
            <div className="flex flex-shrink-0 items-center divide-x divide-[color:var(--app-border)] rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
              <JobStatCell label="Total" value={jobs.length} />
              <JobStatCell label="Published" value={jobs.filter((job) => job.isPublished).length} />
              <JobStatCell label="Applicants" value={jobs.reduce((sum, job) => sum + job.applicantCount, 0)} />
            </div>
          </div>

        <DataTable
          columns={[
            {
              header: "Job",
              width: "w-[26%]",
              render: (job) => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{job.title}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">{job.roleLabel || "No role"}</p>
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
                  href={{
                    pathname: "/people/candidates/applicants",
                    query: { jobId: job.id }
                  }}
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
            },
            {
              header: "Actions",
              width: "w-[18%]",
              render: (job) => {
                return (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={{
                        pathname: "/people/candidates/applicants",
                        query: { jobId: job.id }
                      }}
                    >
                      <Button type="button">Review applicants</Button>
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
                      </>
                    ) : null}
                    {canEditJob ? (
                      <Link href={`/people/candidates/jobs/${job.id}` as Route}>
                        <Button type="button" variant="secondary">Edit job</Button>
                      </Link>
                    ) : null}
                  </div>
                );
              }
            }
          ]}
          data={jobs}
          emptyMessage="Create your first job opening."
        />
        </div>
      </div>
    </SceneShell>
  );
}

function JobStatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5">
      <span className="text-xl font-semibold leading-none text-[color:var(--app-heading)]">{value}</span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{label}</span>
    </div>
  );
}
