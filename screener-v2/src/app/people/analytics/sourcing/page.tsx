import Link from "next/link";
import type { Route } from "next";
import { requirePageSession } from "@/lib/auth/guards";
import { SceneShell } from "@/components/scene/SceneShell";
import { Button } from "@/components/primitives/Button";
import { getSourceBreakdown } from "@/lib/db/analytics";

export const dynamic = "force-dynamic";

export default async function SourcingAnalyticsPage() {
  await requirePageSession("/people/analytics/sourcing");

  const rows = await getSourceBreakdown();
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Analytics"
      title="Sourcing"
      subtitle="Applications by source channel"
      utility={
        <Link href={"/people/analytics" as Route}>
          <Button variant="secondary">Back</Button>
        </Link>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total applications" value={total} />
          <StatCard label="Source channels tracked" value={rows.length} />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-8 text-center">
            <p className="text-sm text-[color:var(--app-muted)]">
              No source data yet. Source attribution is recorded when candidates apply via a tagged link.
            </p>
          </div>
        ) : (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[color:var(--app-muted)]">
              Breakdown
            </h2>
            <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--app-border)] text-[color:var(--app-muted)]">
                    <th className="px-5 py-3 text-left font-medium">Source</th>
                    <th className="px-5 py-3 text-right font-medium">Applications</th>
                    <th className="px-5 py-3 text-right font-medium">Share</th>
                    <th className="px-5 py-3 w-full" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.source}
                      className={i < rows.length - 1 ? "border-b border-[color:var(--app-border)]" : ""}
                    >
                      <td className="px-5 py-3 font-medium text-[color:var(--app-heading)]">
                        {row.label}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-[color:var(--app-text)]">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-[color:var(--app-muted)]">
                        {row.pct}%
                      </td>
                      <td className="px-5 py-3">
                        <div className="h-2 rounded-full bg-[color:var(--app-surface-soft)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[color:var(--app-brand)]"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </SceneShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[color:var(--app-muted)]">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums text-[color:var(--app-heading)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
