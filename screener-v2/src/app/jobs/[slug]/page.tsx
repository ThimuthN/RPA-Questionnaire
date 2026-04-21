import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { JobDescriptionContent } from "@/components/jobs/JobDescriptionContent";
import { StatusPill } from "@/components/primitives/StatusPill";
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
  const detailPoints = [
    job.roleLabel ? `${job.roleLabel}${job.roleDepartment ? `, ${job.roleDepartment}` : ""}` : null,
    "Apply directly without creating an account.",
    "You can attach a PDF resume if you have one ready."
  ].filter(Boolean) as string[];

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Northstar jobs"
      title={job.title}
      subtitle={job.summary}
      utility={
        <Link href="/jobs">
          <Button variant="secondary">Back to jobs</Button>
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <StagePanel className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {job.roleLabel ? <StatusPill label={job.roleLabel} tone="blue" /> : null}
              {job.roleDepartment ? <StatusPill label={job.roleDepartment} tone="neutral" /> : null}
              <StatusPill label="No login required" tone="emerald" />
            </div>
            <p className="text-sm leading-6 text-[color:var(--app-muted)]">{job.summary}</p>
          </div>
          <div className="grid gap-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 sm:grid-cols-3">
            {detailPoints.map((point) => (
              <div key={point} className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">At a glance</p>
                <p className="text-sm text-[color:var(--app-text)]">{point}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">About the role</h2>
              <p className="text-sm text-[color:var(--app-muted)]">Review the context first, then apply on the right.</p>
            </div>
            <JobDescriptionContent html={job.description} />
          </div>
        </StagePanel>

        <StagePanel tone="summary" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Apply</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Share the basics here and we will add your application straight into the review queue.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill label="Takes a few minutes" tone="neutral" />
            <StatusPill label="Resume optional" tone="blue" />
            <StatusPill label="PDF if attached" tone="neutral" />
          </div>

          {pageState.applied ? (
            <div className="space-y-3 rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="space-y-1">
                <p className="text-base font-medium text-emerald-50">Application received</p>
                <p>
                  We saved your application for this role.
                  {pageState.resumeError ? " The resume upload did not finish, so only the application details were saved." : ""}
                </p>
              </div>
              <div className="space-y-2 rounded-[16px] border border-emerald-300/20 bg-emerald-950/20 p-3 text-emerald-50/90">
                <p className="text-xs uppercase tracking-[0.16em]">What happens next</p>
                <ul className="space-y-1 text-sm">
                  <li>Our team can now review this application.</li>
                  <li>If there is a fit, they will move you forward from there.</li>
                </ul>
              </div>
            </div>
          ) : null}
          {pageState.alreadyApplied ? (
            <div className="space-y-2 rounded-[18px] border border-brand-300/30 bg-brand-500/10 p-4 text-sm text-[color:var(--app-heading)]">
              <p className="text-base font-medium">Application already received</p>
              <p>We already have an application for this email on this job, so we did not create a duplicate.</p>
            </div>
          ) : null}
          {pageState.error ? (
            <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {pageState.error}
            </div>
          ) : null}

          {!hasConfirmation ? (
            <div className="space-y-4">
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

              <div className="space-y-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">What to expect</p>
                <div className="space-y-2">
                  <p className="text-sm text-[color:var(--app-text)]">1. Submit the basics here.</p>
                  <p className="text-sm text-[color:var(--app-text)]">2. The team reviews your role fit, resume, and note together.</p>
                  <p className="text-sm text-[color:var(--app-text)]">3. If there is a fit, they move you forward from the same review flow.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link href="/jobs">
                <Button type="button" variant="secondary">
                  Back to jobs
                </Button>
              </Link>
              <Link href="/">
                <Button type="button" variant="ghost">
                  Open Northstar
                </Button>
              </Link>
            </div>
          )}
        </StagePanel>
      </div>
    </SceneShell>
  );
}
