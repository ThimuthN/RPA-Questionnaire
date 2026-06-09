import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { ApplicationDraftCleaner, JobApplicationForm } from "@/components/jobs/JobApplicationForm";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getPublicJobPostingBySlug } from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    submitted?: string;
    alreadyApplied?: string;
    error?: string;
    applicationId?: string;
    resumeError?: string;
    hasScreener?: string;
  }>;
}) {
  if (!PUBLIC_JOBS_ENABLED) notFound();

  const { slug } = await params;
  const pageState = await searchParams;
  const job = await getPublicJobPostingBySlug(slug);

  if (!job) notFound();

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Northstar";
  const subtitle = job.roleDepartment ?? job.roleLabel ?? orgName;
  const hasConfirmation = Boolean(pageState.submitted || pageState.alreadyApplied);

  const backToRole = `/jobs/${slug}` as Route;

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Application"
      title={`Apply to ${job.title}`}
      subtitle={`${orgName} · ${subtitle}`}
      utility={
        <Link href={backToRole}>
          <Button variant="secondary">Back to role</Button>
        </Link>
      }
    >
      <div className="max-w-2xl space-y-6">
        {/* ── Submitted ── */}
        {pageState.submitted ? (
          <>
            <ApplicationDraftCleaner slug={slug} />
            <StagePanel className="space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">
                  Application submitted
                </h2>
              </div>
              <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                Thank you. Your application has been received.
                {pageState.resumeError
                  ? " The resume upload did not finish — only your contact details were saved."
                  : ""}
              </p>
              {pageState.hasScreener === "1" ? (
                <div className="rounded-[18px] border border-brand-300/20 bg-brand-400/5 p-4 text-sm text-[color:var(--app-text)]">
                  <p className="font-medium text-[color:var(--app-heading)]">Assessment configured</p>
                  <p className="mt-1 leading-6 text-[color:var(--app-muted)]">
                    This role has a screening assessment. The hiring team will send next steps if
                    they move your application forward.
                  </p>
                </div>
              ) : null}
              {pageState.applicationId ? (
                <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-sm">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                    Application reference
                  </p>
                  <p className="mt-1 font-medium text-[color:var(--app-heading)]">
                    {pageState.applicationId}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--app-muted)]">
                    Use this reference with your email to check status.
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Link href={backToRole}>
                  <Button variant="secondary">Back to role</Button>
                </Link>
                <Link href="/jobs">
                  <Button variant="ghost">View open roles</Button>
                </Link>
              </div>
            </StagePanel>
          </>
        ) : null}

        {/* ── Already applied ── */}
        {pageState.alreadyApplied ? (
          <StagePanel className="space-y-4">
            <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">
              Application already submitted
            </h2>
            <p className="text-sm leading-6 text-[color:var(--app-muted)]">
              You have already applied for this role.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={backToRole}>
                <Button variant="secondary">Back to role</Button>
              </Link>
              <Link href="/jobs">
                <Button variant="ghost">View open roles</Button>
              </Link>
            </div>
          </StagePanel>
        ) : null}

        {/* ── Error banner + form (draft restored) ── */}
        {!hasConfirmation ? (
          <>
            {pageState.error ? (
              <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
                {pageState.error}
              </div>
            ) : null}
            <StagePanel className="space-y-5">
              <JobApplicationForm jobSlug={slug} />
            </StagePanel>
          </>
        ) : null}
      </div>
    </SceneShell>
  );
}
