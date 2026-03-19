import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import type { ResultSummary } from "@/lib/assessment-engine/types";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import { copy } from "@/lib/design/copy";

function statusLabel(row: ResultSummary) {
  if (row.pass) return "Pass";
  if (row.borderline) return "Review";
  return "Fail";
}

function sectionSummary(row: ResultSummary) {
  const entries = row.exams
    .map((exam) => row.examBreakdown[exam.instanceId])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  if (entries.length === 0) return "No exam data";
  return entries
    .map(
      (entry) =>
        `#${entry.order + 1} ${entry.label} ${entry.weightedMarksEarned.toFixed(1)}/${entry.weightedMarksPossible} (${entry.percent.toFixed(1)}%)`
    )
    .join(" | ");
}

export function AttemptTable({ rows }: { rows: ResultSummary[] }) {
  if (rows.length === 0) {
    return (
      <StagePanel className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl text-white">No submissions yet</h2>
          <p className="text-slate-200">Results appear here as soon as a candidate submits an assessment.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/create-test">
            <Button>{copy.nav.create}</Button>
          </Link>
          <Link href="/run-test?mode=live_call">
            <Button variant="secondary">{copy.runModes.live}</Button>
          </Link>
        </div>
      </StagePanel>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <StagePanel key={row.attemptId} className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={statusLabel(row)} tone={row.pass ? "emerald" : row.borderline ? "amber" : "red"} />
                <StatusPill label={row.roleId} tone="neutral" />
              </div>
              <div className="space-y-1">
                <p className="text-base text-white">{row.candidateName || "Unnamed candidate"}</p>
                <p className="text-sm text-slate-300">{row.candidateEmail || "No email captured"}</p>
                <Link
                  className="font-mono text-xs text-slate-200 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                  href={`/results/${row.attemptId}`}
                >
                  {row.attemptId.slice(0, 12)}
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.results.finalScore}</p>
                <p className="mt-1 text-lg text-white">{row.finalPercent.toFixed(1)} / 100</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Exam scores</p>
                <p className="mt-1 text-sm text-slate-200">{sectionSummary(row)}</p>
              </div>
              <div className="flex items-center lg:justify-end">
                <Link
                  className="inline-flex rounded-full border border-brand-300/50 px-3 py-1.5 text-xs font-medium text-brand-200 transition hover:border-brand-300 hover:bg-brand-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                  href={`/results/${row.attemptId}`}
                >
                  Open result
                </Link>
              </div>
            </div>
          </div>
        </StagePanel>
      ))}
    </div>
  );
}
