import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getPublicJobPostingBySlug } from "@/lib/db/jobs";

export const dynamic = "force-dynamic";

export default async function PublicJobDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ applied?: string; alreadyApplied?: string; resumeError?: string; error?: string }>;
}) {
  const { slug } = await params;
  const pageState = await searchParams;
  const job = await getPublicJobPostingBySlug(slug);

  if (!job) {
    notFound();
  }

  const hasConfirmation = Boolean(pageState.applied || pageState.alreadyApplied);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Northstar jobs"
      title={job.title}
      subtitle={job.roleLabel || job.summary}
      utility={
        <Link href="/jobs">
          <Button variant="secondary">Back to jobs</Button>
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <StagePanel className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-[color:var(--app-muted)]">{job.summary}</p>
            {job.roleDepartment ? (
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">{job.roleDepartment}</p>
            ) : null}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--app-text)]">{job.description}</div>
        </StagePanel>

        <StagePanel tone="summary" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Apply</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Share the basics and attach a resume if you have one ready.</p>
          </div>

          {pageState.applied ? (
            <div className="rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Application received.
              {pageState.resumeError ? " We saved the application, but the resume upload did not finish." : ""}
            </div>
          ) : null}
          {pageState.alreadyApplied ? (
            <div className="rounded-[18px] border border-brand-300/30 bg-brand-500/10 p-4 text-sm text-[color:var(--app-heading)]">
              We already have an application for this email on this job.
            </div>
          ) : null}
          {pageState.error ? (
            <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {pageState.error}
            </div>
          ) : null}

          {!hasConfirmation ? (
            <form action={`/api/jobs/${job.slug}/apply`} method="post" encType="multipart/form-data" className="space-y-4">
              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Full name</span>
                <input
                  name="fullName"
                  required
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Phone</span>
                <input
                  name="phone"
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Resume (optional)</span>
                <input
                  name="resume"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)]"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Cover note (optional)</span>
                <textarea
                  name="coverNote"
                  rows={5}
                  placeholder="A short note about why you are applying."
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>
              <Button type="submit">Submit application</Button>
            </form>
          ) : (
            <Link href="/jobs">
              <Button type="button" variant="secondary">
                Back to jobs
              </Button>
            </Link>
          )}
        </StagePanel>
      </div>
    </SceneShell>
  );
}
