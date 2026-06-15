import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, CheckCircle2, DollarSign, MapPin, Users } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { PublicSiteFrame } from "@/components/marketing/PublicSiteFrame";
import { JobDescriptionContent } from "@/components/jobs/JobDescriptionContent";
import { ApplicationDraftCleaner } from "@/components/jobs/JobApplicationForm";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getPublicJobPostingBySlug } from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
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
  if (!PUBLIC_JOBS_ENABLED) notFound();

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Northstar";
  const { slug } = await params;
  const pageState = await searchParams;
  const job = await getPublicJobPostingBySlug(slug);

  if (!job) notFound();

  const hasConfirmation = Boolean(pageState.applied || pageState.alreadyApplied);
  const applyHref = `/jobs/${job.slug}/apply` as Route;

  const salaryLabel =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
      : job.salaryMin
        ? `$${(job.salaryMin / 1000).toFixed(0)}k+`
        : null;

  return (
    <PublicSiteFrame current="careers">
      <SceneShell
        variant="results"
        tone="page"
        eyebrow=""
        title=""
        hideHeader
      >
        {hasConfirmation && <ApplicationDraftCleaner slug={job.slug} />}

      {/* ── Job header card ── */}
      <div className="mb-8 rounded-[28px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 md:p-8 space-y-5">

        {/* Company row */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-2xl border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_20%,var(--app-surface-soft)),var(--app-surface-muted))] flex items-center justify-center text-xl font-bold text-[color:var(--app-brand)]">
            {orgName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[color:var(--app-heading)]">{orgName}</p>
            {job.roleDepartment ? (
              <p className="text-xs text-[color:var(--app-muted)]">{job.roleDepartment}</p>
            ) : null}
          </div>
          <Link href="/jobs" className="shrink-0">
            <Button variant="ghost">All roles</Button>
          </Link>
        </div>

        {/* Job title */}
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--app-heading)] sm:text-3xl leading-snug">
            {job.title}
          </h1>
          {job.roleLabel ? (
            <p className="mt-1 text-sm text-[color:var(--app-muted)]">{job.roleLabel}</p>
          ) : null}
        </div>

        {/* Metadata chips */}
        {(job.remotePolicy || salaryLabel || job.roleDepartment) ? (
          <div className="flex flex-wrap gap-2">
            {job.remotePolicy ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1 text-xs text-[color:var(--app-text)]">
                <MapPin className="h-3.5 w-3.5 text-[color:var(--app-muted)]" />
                {job.remotePolicy}
              </span>
            ) : null}
            {salaryLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1 text-xs text-[color:var(--app-text)]">
                <DollarSign className="h-3.5 w-3.5 text-[color:var(--app-muted)]" />
                {salaryLabel}
              </span>
            ) : null}
            {job.roleDepartment ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1 text-xs text-[color:var(--app-text)]">
                <Briefcase className="h-3.5 w-3.5 text-[color:var(--app-muted)]" />
                {job.roleDepartment}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Footer: date + CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--app-border)] pt-5">
          <p className="text-xs text-[color:var(--app-muted)]">
            Updated {dateFormatter.format(new Date(job.updatedAt))}
          </p>
          {!hasConfirmation ? (
            <Link href={applyHref}>
              <Button>Apply now</Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* ── Success confirmation ── */}
      {pageState.applied ? (
        <div className="mb-8 rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-50">Application received — you&apos;re in the queue</p>
              <p className="text-sm text-emerald-100/80">
                {pageState.resumeError
                  ? "Your application was saved, but the resume upload did not complete. Only your contact details were recorded — you may reapply to attach your CV."
                  : `Your application for ${job.title} has been submitted to the ${orgName} hiring team.`}
              </p>
            </div>
          </div>
          <div className="border-t border-emerald-400/20 pt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-300">What happens next</p>
            <ol className="space-y-1.5 text-sm text-emerald-100/80 list-none">
              <li className="flex gap-2"><span className="text-emerald-400 font-semibold shrink-0">1.</span>Our team reviews your application, usually within 5–7 business days.</li>
              <li className="flex gap-2"><span className="text-emerald-400 font-semibold shrink-0">2.</span>If shortlisted, you&apos;ll receive an email to schedule a screening call.</li>
              <li className="flex gap-2"><span className="text-emerald-400 font-semibold shrink-0">3.</span>Selected candidates proceed to interviews and assessments.</li>
            </ol>
          </div>
        </div>
      ) : null}
      {pageState.alreadyApplied ? (
        <div className="mb-8 rounded-[20px] border border-brand-300/30 bg-brand-500/10 p-5 space-y-1">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">Application already on file</p>
          <p className="text-sm text-[color:var(--app-muted)]">
            We already have an application for this email address on this role. Our team will be in touch if you are shortlisted — no further action is needed.
          </p>
        </div>
      ) : null}

      {/* ── 2-col layout ── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

        {/* Main: description */}
        <StagePanel className="space-y-5">
          <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">About the role</h2>
          <div className="text-sm leading-7 text-[color:var(--app-muted)]">
            <JobDescriptionContent html={job.description} />
          </div>
        </StagePanel>

        {/* Right rail: Apply card */}
        <div className="xl:sticky xl:top-6 h-fit">
          <StagePanel tone="summary" className="space-y-5">

            {/* Mini header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_18%,var(--app-surface-soft)),var(--app-surface-muted))] flex items-center justify-center text-sm font-bold text-[color:var(--app-brand)]">
                {orgName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[color:var(--app-heading)]">
                  {job.title}
                </p>
                <p className="text-xs text-[color:var(--app-muted)]">{orgName}</p>
              </div>
            </div>

            {/* Facts list */}
            {(job.remotePolicy || salaryLabel || job.roleDepartment || job.teamSize) ? (
              <div className="space-y-2.5 border-t border-[color:var(--app-border)] pt-4">
                {job.remotePolicy ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-[color:var(--app-muted)]" />
                    <span className="text-[color:var(--app-text)]">{job.remotePolicy}</span>
                  </div>
                ) : null}
                {salaryLabel ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    <DollarSign className="h-4 w-4 shrink-0 text-[color:var(--app-muted)]" />
                    <span className="text-[color:var(--app-text)]">{salaryLabel}</span>
                  </div>
                ) : null}
                {job.roleDepartment ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Briefcase className="h-4 w-4 shrink-0 text-[color:var(--app-muted)]" />
                    <span className="text-[color:var(--app-text)]">{job.roleDepartment}</span>
                  </div>
                ) : null}
                {job.teamSize ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Users className="h-4 w-4 shrink-0 text-[color:var(--app-muted)]" />
                    <span className="text-[color:var(--app-text)]">
                      {job.teamSize} on team
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* CTA */}
            {!hasConfirmation ? (
              <div className="space-y-2 border-t border-[color:var(--app-border)] pt-4">
                <Link href={applyHref} className="block">
                  <Button className="w-full justify-center">Apply now</Button>
                </Link>
                <Link href="/jobs" className="block">
                  <Button variant="ghost" className="w-full justify-center text-sm">
                    All roles
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 border-t border-[color:var(--app-border)] pt-4">
                <Link href="/jobs">
                  <Button variant="secondary">Back to jobs</Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost">Open Northstar</Button>
                </Link>
              </div>
            )}
          </StagePanel>
        </div>
      </div>
      </SceneShell>
    </PublicSiteFrame>
  );
}
