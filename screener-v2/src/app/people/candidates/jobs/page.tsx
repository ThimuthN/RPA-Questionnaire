import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
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
      ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
      : "rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100";

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

        {jobs.length === 0 ? (
          <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
            <h2 className="text-2xl text-[color:var(--app-heading)]">No jobs yet</h2>
            <p className="mt-2 text-sm text-[color:var(--app-muted)]">Create the first opening to publish a public application page.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)]">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full table-fixed text-left">
                <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                  <tr>
                    <th className="w-[28%] px-4 py-3 font-medium">Job</th>
                    <th className="w-[16%] px-4 py-3 font-medium">Role</th>
                    <th className="w-[14%] px-4 py-3 font-medium">Applicants</th>
                    <th className="w-[16%] px-4 py-3 font-medium">Status</th>
                    <th className="w-[12%] px-4 py-3 font-medium">Updated</th>
                    <th className="w-[14%] px-4 py-3 font-medium text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-surface-soft)]/70">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">{job.title}</p>
                          <p className="text-xs text-[color:var(--app-muted)]">{job.summary}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[color:var(--app-text)]">{job.roleLabel || "No role"}</td>
                      <td className="px-4 py-4 text-sm text-[color:var(--app-text)]">
                        <Link
                          href={{
                            pathname: "/people/candidates/applicants",
                            query: { jobId: job.id }
                          }}
                          className="text-[color:var(--app-brand)] hover:underline"
                        >
                          {job.applicantCount}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label={job.isPublished ? "Published" : "Draft"} tone={job.isPublished ? "emerald" : "neutral"} />
                          <StatusPill label={job.isOpen ? "Open" : "Closed"} tone={job.isOpen ? "blue" : "amber"} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[color:var(--app-muted)]">
                        {new Date(job.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/people/candidates/jobs/${job.id}` as Route}>
                            <Button type="button" className="px-3 py-2 text-xs">
                              Open
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SceneShell>
  );
}
