import Link from "next/link";
import type { Route } from "next";
import { requirePageSession } from "@/lib/auth/guards";
import { SceneShell } from "@/components/scene/SceneShell";
import { Button } from "@/components/primitives/Button";
import { getInterviewerLoad } from "@/lib/db/analytics";

export const dynamic = "force-dynamic";

function SubmissionBadge({ rate }: { rate: number }) {
  const color =
    rate >= 80
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-400/30"
      : rate >= 50
      ? "text-amber-400 bg-amber-500/10 border-amber-400/30"
      : "text-red-400 bg-red-500/10 border-red-400/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums ${color}`}>
      {rate}%
    </span>
  );
}

export default async function InterviewsAnalyticsPage() {
  await requirePageSession("/people/analytics/interviews");

  const load30 = await getInterviewerLoad(30);
  const load90 = await getInterviewerLoad(90);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Analytics"
      title="Interviewer load"
      subtitle="Panel counts and scorecard submission rates"
      utility={
        <Link href={"/people/analytics" as Route}>
          <Button variant="secondary">Back</Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Interviewers (30d)" value={load30.length} />
          <StatCard
            label="Avg scorecard rate (30d)"
            value={
              load30.length > 0
                ? Math.round(load30.reduce((s, r) => s + r.submissionRate, 0) / load30.length)
                : 0
            }
            suffix="%"
          />
          <StatCard label="Total panels (90d)" value={load90.reduce((s, r) => s + r.panelCount, 0)} />
        </div>

        {/* Last 30 days */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[color:var(--app-muted)]">
            Last 30 days
          </h2>
          {load30.length === 0 ? (
            <p className="text-sm text-[color:var(--app-muted)]">No interview data for this period.</p>
          ) : (
            <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--app-border)] text-[color:var(--app-muted)]">
                    <th className="px-5 py-3 text-left font-medium">Interviewer</th>
                    <th className="px-5 py-3 text-right font-medium">Panels</th>
                    <th className="px-5 py-3 text-right font-medium">Feedback</th>
                    <th className="px-5 py-3 text-right font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {load30.map((row, i) => (
                    <tr
                      key={row.userId}
                      className={i < load30.length - 1 ? "border-b border-[color:var(--app-border)]" : ""}
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-[color:var(--app-heading)]">{row.name}</p>
                        <p className="text-xs text-[color:var(--app-muted)]">{row.email}</p>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-[color:var(--app-text)]">
                        {row.panelCount}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-[color:var(--app-text)]">
                        {row.feedbackSubmitted}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <SubmissionBadge rate={row.submissionRate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SceneShell>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[color:var(--app-muted)]">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums text-[color:var(--app-heading)]">
        {value.toLocaleString()}
        {suffix && (
          <span className="ml-1.5 text-base font-normal text-[color:var(--app-muted)]">{suffix}</span>
        )}
      </p>
    </div>
  );
}
