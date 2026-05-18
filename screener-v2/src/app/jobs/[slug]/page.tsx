import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BriefcaseBusiness, Building2, CheckCircle2, Clock3, FileText } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { JobDescriptionContent } from "@/components/jobs/JobDescriptionContent";
import { JobQuickFactsCard } from "@/components/jobs/JobQuickFactsCard";
import { JobApplicationForm } from "@/components/jobs/JobApplicationForm";
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
    error?: string;
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
            <Link href="#apply">
              <Button>Easy apply</Button>
            </Link>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <div className="space-y-6">
          <StagePanel className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--app-text)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5">
                <Building2 className="h-4 w-4 text-[color:var(--app-brand)]" />
                {orgName}
              </span>
              {job.roleLabel ? (
                <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5">
                  {job.roleLabel}
                </span>
              ) : null}
              {job.roleDepartment ? (
                <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5">
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

            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
              <span>Updated {updatedAtFormatter.format(new Date(job.updatedAt))}</span>
              <span>•</span>
              <span>Apply from this page</span>
            </div>

            <div className="grid gap-4 rounded-[26px] border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_12%,var(--app-surface)),var(--app-surface-soft))] p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Role snapshot</p>
                <h2 className="text-2xl text-[color:var(--app-heading)]">A focused application experience</h2>
                <p className="text-sm leading-7 text-[color:var(--app-muted)]">
                  Review the role first, then use the easy-apply panel to send your details directly into the hiring
                  workflow.
                </p>
              </div>
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">What to expect</p>
                    <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                      Read the full description, complete the application card, and submit in one pass.
                    </p>
                    <p className="text-sm text-[color:var(--app-text)]">
                      {job.applicantCount > 0 ? `${job.applicantCount} application${job.applicantCount === 1 ? "" : "s"} already in review.` : "No applications yet — be one of the first candidates."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StagePanel>

          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Job description</h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                Everything candidates should be able to review before deciding to apply.
              </p>
            </div>
            <JobDescriptionContent html={job.description} />
          </StagePanel>
        </div>

        <StagePanel id="apply" tone="summary" className="h-fit space-y-5 xl:sticky xl:top-6">
          <div className="space-y-2 border-b border-[color:var(--app-border)] pb-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Easy apply</p>
              <h2 className="text-2xl text-[color:var(--app-heading)]">Apply to {job.title}</h2>
            </div>
            <p className="text-sm leading-6 text-[color:var(--app-muted)]">
              Share your contact details, add a resume if you have one ready, and send everything straight to the
              hiring review queue from this page.
            </p>
          </div>

          {!hasConfirmation ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Profile</p>
                    <p className="text-xs leading-5 text-[color:var(--app-muted)]">Add your contact details.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Resume</p>
                    <p className="text-xs leading-5 text-[color:var(--app-muted)]">Attach a PDF if available.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Submit</p>
                    <p className="text-xs leading-5 text-[color:var(--app-muted)]">Complete the form in one place.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {pageState.applied ? (
            <div className="space-y-3 rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-base font-medium text-emerald-50">
                  <CheckCircle2 className="h-4 w-4" />
                  Application received
                </p>
                <p>
                  We saved your application for this role.
                  {pageState.resumeError ? " The resume upload did not finish, so only the application details were saved." : ""}
                </p>
              </div>
              {pageState.hasScreener === "1" ? (
                <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  <p className="font-medium">Assessment next</p>
                  <p>
                    We&apos;ve sent an assessment link to your email address. Check your inbox and complete it within 7 days to move forward.
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
              <p className="text-sm text-emerald-50/90">If there is a fit, the team will move you forward from the same review workflow.</p>
            </div>
          ) : null}
          {pageState.alreadyApplied ? (
            <div className="space-y-2 rounded-[18px] border border-brand-300/30 bg-brand-500/10 p-5 text-sm text-[color:var(--app-heading)]">
              <p className="text-base font-medium">Application already received</p>
              <p>We already have an application for this email on this job, so we did not create a duplicate.</p>
            </div>
          ) : null}
          {pageState.error ? (
            <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
              {pageState.error}
            </div>
          ) : null}

          {!hasConfirmation ? (
            <JobApplicationForm jobSlug={job.slug} />
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
