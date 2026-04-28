import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getPublicApplicationStatus } from "@/lib/db/jobs";
import { candidateApplicationStatusLabels } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

export default async function ApplicationStatusPage({
  searchParams
}: {
  searchParams: Promise<{ applicationId?: string; email?: string }>
}) {
  const params = await searchParams;
  const applicationId = params.applicationId?.trim();
  const email = params.email?.trim();

  const status = applicationId && email ? await getPublicApplicationStatus(applicationId, email) : null;
  const hasSearch = Boolean(applicationId || email);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Northstar careers"
      title="Application status"
      subtitle="Check the progress of your job application with your email and reference number."
      utility={
        <Link href="/jobs">
          <Button variant="secondary">Back to jobs</Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <StagePanel className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm text-[color:var(--app-muted)]">
              Enter the email you applied with and your application reference to view the current status.
            </p>
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" method="get">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[color:var(--app-heading)]">Application reference</span>
                <input
                  name="applicationId"
                  defaultValue={applicationId ?? ""}
                  placeholder="e.g. abc123"
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[color:var(--app-heading)]">Email address</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={email ?? ""}
                  placeholder="you@example.com"
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>
              <div className="flex items-end">
                <Button type="submit" className="w-full">Check status</Button>
              </div>
            </form>
          </div>
        </StagePanel>

        {hasSearch ? (
          status ? (
            <StagePanel className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Application details</p>
                <h2 className="text-2xl text-[color:var(--app-heading)]">{status.jobTitle}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Reference</p>
                  <p className="mt-2 text-base text-[color:var(--app-heading)]">{status.applicationId}</p>
                </div>
                <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Status</p>
                  <p className="mt-2 text-base text-[color:var(--app-heading)]">{candidateApplicationStatusLabels[status.status]}</p>
                </div>
              </div>
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-sm text-[color:var(--app-muted)]">Applied on</p>
                <p className="mt-1 text-base text-[color:var(--app-heading)]">{new Date(status.appliedAt).toLocaleDateString()}</p>
              </div>
            </StagePanel>
          ) : (
            <StagePanel className="space-y-4 rounded-[24px] border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
              <p className="font-medium">Application not found.</p>
              <p>Please check your reference and email, then try again.</p>
            </StagePanel>
          )
        ) : null}
      </div>
    </SceneShell>
  );
}
