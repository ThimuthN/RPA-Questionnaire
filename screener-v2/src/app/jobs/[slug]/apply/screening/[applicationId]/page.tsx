import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getAttempt } from "@/lib/db/repositories";
import {
  getPublicApplicationScreeningContext,
  publicApplicationScreeningFinishHref
} from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";
import {
  getRuntimeSession,
  runtimeSessionMatchesAttempt
} from "@/lib/auth/runtime-session";

export const dynamic = "force-dynamic";

export default async function PublicApplicationScreeningPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; applicationId: string }>;
  searchParams: Promise<{ resumeError?: string }>;
}) {
  if (!PUBLIC_JOBS_ENABLED) {
    notFound();
  }

  const { slug, applicationId } = await params;
  const pageState = await searchParams;
  const context = await getPublicApplicationScreeningContext({
    applicationId,
    jobSlug: slug
  });

  if (!context) {
    notFound();
  }

  const finishHref = publicApplicationScreeningFinishHref({
    jobSlug: slug,
    applicationId,
    resumeError: pageState.resumeError === "1"
  });
  const recoveryHref = `/jobs/${slug}/apply?error=${encodeURIComponent(
    "Your screening session expired. Submit the application again to reopen it."
  )}`;
  const runtimeSession = await getRuntimeSession();
  if (!runtimeSessionMatchesAttempt(runtimeSession, {
    attemptId: context.attemptId,
    slug: context.runtimeSlug
  })) {
    redirect(recoveryHref as Route);
  }

  const attempt = await getAttempt(context.attemptId);
  if (!attempt) {
    notFound();
  }

  if (attempt.status === "submitted") {
    redirect(finishHref as Route);
  }

  const attemptHref = `/jobs/${slug}/apply/screening/${applicationId}/attempt/${context.attemptId}${
    pageState.resumeError === "1" ? "?resumeError=1" : ""
  }`;

  return (
    <SceneShell
      variant="run"
      eyebrow="Application screening"
      title="Automatic screening"
      subtitle={`${context.jobTitle} - ${context.roleDepartment ?? context.roleLabel ?? "Hiring"}`}
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${context.screeningPackage.addons.length} modules`} tone="blue" />
          <StatusPill label={`${context.totalDurationMinutes}m total`} tone="teal" />
          <StatusPill label="One attempt" tone="amber" />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <StagePanel className="space-y-5 border-[color:var(--app-border-strong)] shadow-[0_20px_50px_rgba(22,58,77,0.16)]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Next step</p>
            <h2 className="text-3xl text-[color:var(--app-heading)]">Continue into the screening session</h2>
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--app-text)]">
              Your application details are already saved. The next screen uses the platform&apos;s full assessment experience so the hiring team can review the exact evidence attached to this application.
            </p>
          </div>

          {pageState.resumeError === "1" ? (
            <div className="rounded-[18px] border border-[color:var(--app-warning)]/35 bg-[color:var(--app-warning-soft)] px-4 py-3 text-sm text-[color:var(--app-warning)]">
              Your application was saved, but the resume upload did not finish. Screening will continue now.
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg-strong)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Candidate</p>
              <p className="mt-1 text-sm text-[color:var(--app-heading)]">{context.candidateName}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg-strong)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Autosave</p>
              <p className="mt-1 text-sm text-[color:var(--app-heading)]">Enabled</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg-strong)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Outcome</p>
              <p className="mt-1 text-sm text-[color:var(--app-heading)]">Saved to this application</p>
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--app-border-strong)] bg-[linear-gradient(180deg,var(--app-control-bg-strong),var(--app-surface-soft))] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--app-heading)]">
                  {context.screeningPackage.presetLabel}
                </p>
                <p className="mt-1 text-sm text-[color:var(--app-muted)]">
                  The screening starts in a focused assessment view. When you finish, the application returns to the hiring queue with your results attached.
                </p>
              </div>
              <Link href={attemptHref as Route}>
                <Button>Start screening</Button>
              </Link>
            </div>
          </div>
        </StagePanel>

        <StagePanel className="space-y-4 border-[color:var(--app-border-strong)] shadow-[0_20px_50px_rgba(22,58,77,0.16)] lg:sticky lg:top-20 lg:h-fit">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Included modules</p>
            <h3 className="text-xl text-[color:var(--app-heading)]">Assessment outline</h3>
          </div>
          <div className="space-y-3">
            {context.screeningPackage.addons.map((addon) => (
              <div
                key={addon.key}
                className="rounded-[18px] border border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg-strong)] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">{addon.addonLabel}</p>
                    <p className="mt-1 text-sm text-[color:var(--app-muted)]">{addon.configSummary}</p>
                  </div>
                  <p className="text-xs text-[color:var(--app-muted)]">{addon.durationMinutes}m</p>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                  Pass {addon.requiredPercent}%{addon.weight > 0 ? ` | Weight ${addon.weight}` : ""}{addon.isMandatory ? " | Required" : ""}
                </p>
              </div>
            ))}
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
