import Link from "next/link";
import type { Route } from "next";
import { requirePageSession } from "@/lib/auth/guards";
import { SceneShell } from "@/components/scene/SceneShell";
import { Button } from "@/components/primitives/Button";
import { getFunnelConversion, getStageTimings } from "@/lib/db/analytics";

export const dynamic = "force-dynamic";

export default async function PipelineAnalyticsPage() {
  await requirePageSession("/people/analytics/pipeline");

  const [funnel, timings] = await Promise.all([getFunnelConversion(), getStageTimings()]);

  const maxCount = Math.max(...funnel.map((r) => r.count), 1);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Analytics"
      title="Pipeline funnel"
      subtitle="Stage conversion and time-in-stage averages"
      utility={
        <Link href={"/people/analytics" as Route}>
          <Button variant="secondary">Back</Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Funnel */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[color:var(--app-muted)]">
            Stage funnel
          </h2>
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--app-border)] text-[color:var(--app-muted)]">
                  <th className="px-5 py-3 text-left font-medium w-36">Stage</th>
                  <th className="px-5 py-3 text-right font-medium w-20">Count</th>
                  <th className="px-5 py-3 text-right font-medium w-24">Conversion</th>
                  <th className="px-5 py-3 w-full" />
                </tr>
              </thead>
              <tbody>
                {funnel.map((row, i) => (
                  <tr
                    key={row.stage}
                    className={i < funnel.length - 1 ? "border-b border-[color:var(--app-border)]" : ""}
                  >
                    <td className="px-5 py-3 text-[color:var(--app-text)]">{row.label}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-[color:var(--app-heading)]">
                      {row.count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[color:var(--app-muted)]">
                      {row.conversionFromPrev !== null ? `${row.conversionFromPrev}%` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-2 rounded-full bg-[color:var(--app-surface-soft)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[color:var(--app-brand)]"
                          style={{ width: `${(row.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Time in stage */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[color:var(--app-muted)]">
            Time in stage (active candidates)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {timings.map((t) => (
              <div
                key={t.stage}
                className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5"
              >
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[color:var(--app-muted)]">
                  {t.label}
                </p>
                <p className="text-2xl font-bold tabular-nums text-[color:var(--app-heading)]">
                  {t.avgDays}
                  <span className="ml-1 text-sm font-normal text-[color:var(--app-muted)]">
                    avg days
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">
                  {t.medianDays}d median
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SceneShell>
  );
}
