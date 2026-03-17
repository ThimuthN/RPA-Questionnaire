import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { getDetailedResult } from "@/lib/db/repositories";
import { ResultRevealHero } from "@/components/results/ResultRevealHero";
import { ResultReviewSections } from "@/components/results/ResultReviewSections";
import { SignalCard } from "@/components/primitives/SignalCard";
import { SceneShell } from "@/components/scene/SceneShell";
import { DecisionStage } from "@/components/results/DecisionStage";
import { copy } from "@/lib/design/copy";
import type { ResultSummary } from "@/lib/assessment-engine/types";

export const dynamic = "force-dynamic";

function getSignals(row: ResultSummary) {
  const entries = Object.entries(row.breakdownByCategory).sort((a, b) => b[1].percent - a[1].percent);
  const best = entries[0];
  const weakest = entries[entries.length - 1];
  const confidence =
    row.pass ? "Strong pass confidence" : row.borderline ? "Borderline confidence" : "Low confidence";

  return {
    strength: best ? `${best[0]} (${best[1].percent.toFixed(1)}%)` : "No category data yet",
    risk: weakest ? `${weakest[0]} (${weakest[1].percent.toFixed(1)}%)` : "No category risk",
    confidence
  };
}

export default async function ResultDetailPage({
  params
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const result = await getDetailedResult(attemptId);
  if (!result) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl text-white">Result not found</h1>
        <Link href="/results">
          <Button variant="secondary">Back to Results</Button>
        </Link>
      </section>
    );
  }
  const row = result.summary;
  const signals = getSignals(row);

  return (
    <SceneShell
      variant="results"
      eyebrow="Result"
      title={row.candidateName || `Attempt ${attemptId.slice(0, 12)}`}
      subtitle={row.candidateEmail || undefined}
      utility={
        <div className="flex flex-wrap gap-2">
          <Link href="/results">
            <Button variant="secondary">Back to Results</Button>
          </Link>
          <a href="/api/results/export.csv">
            <Button>Export CSV</Button>
          </a>
          <a href="/api/results/export.json">
            <Button variant="secondary">Export JSON</Button>
          </a>
        </div>
      }
    >
      <DecisionStage
        hero={<ResultRevealHero row={row} />}
        signals={
          <>
            <SignalCard label={copy.results.topStrength} value={signals.strength} tone="emerald" />
            <SignalCard label={copy.results.mainRisk} value={signals.risk} tone="amber" />
            <SignalCard label={copy.results.confidence} value={signals.confidence} tone="blue" />
          </>
        }
      >
        <div className="space-y-3">
          <h2 className="text-xl text-white">{copy.results.categoryBreakdown}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(row.breakdownByCategory).map(([key, value]) => (
              <div
                key={key}
                className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-100">{key}</p>
                  <p className="text-sm text-white">{value.percent.toFixed(1)}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(47,134,255,1),rgba(18,179,168,0.92))]"
                    style={{ width: `${value.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {value.correctCount}/{value.totalCount} correct
                </p>
              </div>
            ))}
          </div>
        </div>
        <ResultReviewSections sections={result.reviewSections} />
      </DecisionStage>
    </SceneShell>
  );
}
