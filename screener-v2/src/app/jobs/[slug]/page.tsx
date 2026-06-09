import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { JobDescriptionContent } from "@/components/jobs/JobDescriptionContent";
import { JobQuickFactsCard } from "@/components/jobs/JobQuickFactsCard";
import { ApplicationDraftCleaner } from "@/components/jobs/JobApplicationForm";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getPublicJobPostingBySlug } from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";

export const dynamic = "force-dynamic";

const updatedAtFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export default async function PublicJobDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    applied?: string;
    alreadyApplied?: string;
    resumeError?: string;
    applicationId?: string;
    hasScreener?: string;
  }>;
}) {
  if (!PUBLIC_JOBS_ENABLED) {
    notFound();
  }

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Northstar";
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
      eyebrow={`${orgName} careers`}
      title={job.title}
      subtitle={job.summary}
      utility={
        <>
          <Link href="/jobs">
            <Button variant="secondary">All roles</Button>
          </Link>
          {!hasConfirmation ? (
            <Link href={`/jobs/${job.slug}/apply` as Route}>
              <Button>Apply</Button>
            </Link>
          ) : null}
        </>
      }
    >
      {hasConfirmation && <ApplicationDraftCleaner slug={job.slug} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px]">
        {/* Main: role content */}
        <div className="space-y-6">
          <StagePanel className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {job.roleLabel ? (
                <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5 text-sm text-[color:var(--app-text)]">
                  {job.roleLabel}
                </span>
              ) : null}
              {job.roleDepartment ? (
                <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5 text-sm text-[color:var(--app-text)]">
                  {job.roleDepartment}
                </span>
              ) : null}
            </div>

            <JobQuickFactsCard
              salaryMin={job.salaryMin}
              salaryMax={job.salaryMax}
              teamSize={job.teamSize}
              techStack={job.techStack}
              remotePolicy={job.remotePolicy}
              companyName={orgName}
            />

            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
              Updated {updatedAtFormatter.format(new Date(job.updatedAt))}
            </p>
          </StagePanel>

          <StagePanel className="space-y-4">
            <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">About the role</h2>
            <JobDescriptionContent html={job.description} />
          </StagePanel>
        </div>

        {/* Right rail: Apply CTA or confirmation */}
        <StagePanel tone="summary" className="h-fit space-y-5 xl:sticky xl:top-6">
          {!hasConfirmation ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                  Ready to apply?
                </p>
                <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                  Submit your application for {job.title}.
                </p>
              </div>
              <Link href={`/jobs/${job.slug}/apply` as Route} className="block">
                <Button className="w-full justify-center">Apply now</Button>
              </Link>
              <Link href="/jobs" className="block">
                <Button type="button" variant="ghost" className="w-full justify-center">
                  Back to jobs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pageState.applied ? (
                <div className="space-y-3 rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-base font-medium text-emerald-50">
                      <CheckCircle2 className="h-4 w-4" />
                      Application received
                    </p>
                    <p>
                      We saved your application for this role.
                      {pageState.resumeError
                        ? " The resume upload did not finish, so only the application details were saved."
                        : ""}
                    </p>
                  </div>
                  {pageState.hasScreener === "1" ? (
                    <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                      <p className="font-medium">Assessment configured</p>
                      <p>
                        This job has a screening assessment configured. The hiring team will send
                        next steps if they move your application forward.
                      </p>
                    </div>
                  ) : null}
                  {pageState.applicationId ? (
                    <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                      <p className="font-medium">Application reference</p>
                      <p>{pageState.applicationId}</p>
                      <p className="mt-2 text-[color:var(--app-foreground-muted)]">
                        Use this reference with your email to check status.
                      </p>
                      <p className="mt-3">
                        <a
                          href={`/jobs/application-status?applicationId=${encodeURIComponent(pageState.applicationId ?? "")}`}
                          className="text-sm font-medium text-white underline"
                        >
                          Check application status
                        </a>
                      </p>
                    </div>
                  ) : null}
                  <p className="text-sm text-emerald-50/90">
                    If there is a fit, the team will move you forward from the same review workflow.
                  </p>
                </div>
              ) : null}
              {pageState.alreadyApplied ? (
                <div className="space-y-2 rounded-[18px] border border-brand-300/30 bg-brand-500/10 p-5 text-sm text-[color:var(--app-heading)]">
                  <p className="text-base font-medium">Application already received</p>
                  <p>
                    We already have an application for this email on this job, so we did not create
                    a duplicate.
                  </p>
                </div>
              ) : null}
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
            </div>
          )}
        </StagePanel>
      </div>
    </SceneShell>
  );
}
