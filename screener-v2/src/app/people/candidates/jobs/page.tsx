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

export default async function CandidateJobsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  await requirePageSession("/people/candidates/jobs");
  const pageState = await searchParams;
  const jobs = await listJobPostings();

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="People"
      title="Candidates"
      subtitle="Manage openings and the public intake path."
      utility={
        <div className="flex flex-wrap items-center gap-2">
          <PeopleViewSwitch current="candidates" />
          <Link href="/people/candidates/jobs/new">
            <Button>Add job</Button>
          </Link>
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
          <h2 className="text-2xl text-[color:var(--app-heading)]">Jobs</h2>
          <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Jobs</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{jobs.length}</p>
          </div>
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Published</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{jobs.filter((job) => job.isPublished).length}</p>
          </div>
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Open applicants</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">
              {jobs.reduce((sum, job) => sum + job.applicantCount, 0)}
            </p>
          </div>
        </div>

        <DataTable
          columns={[
            {
              header: "Job",
              width: "w-[28%]",
              render: (job) => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{job.title}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">{job.summary}</p>
                </div>
              )
            },
            {
              header: "Role",
              width: "w-[16%]",
              render: (job) =>
                job.roleLabel ? (
                  <p className="text-sm text-[color:var(--app-text)]">{job.roleLabel}</p>
                ) : (
                  <StatusPill label="No role" tone="amber" />
                )
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
              header: "Updated",
              width: "w-[12%]",
              render: (job) => <p className="text-sm text-[color:var(--app-muted)]">{new Date(job.updatedAt).toLocaleDateString()}</p>
            },
            {
              header: "Open",
              width: "w-[14%]",
              render: (job) => (
                <div className="text-right">
                  <Link href={`/people/candidates/jobs/${job.id}` as Route}>
                    <Button>Open</Button>
                  </Link>
                </div>
              )
            }
          ]}
          data={jobs}
          emptyMessage="Create the first opening to publish a public application page."
        />
        </div>
      </div>
    </SceneShell>
  );
}
