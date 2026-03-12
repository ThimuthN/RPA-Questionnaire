import { ScoreReveal } from "@/components/motion/ScoreReveal";
import { Card } from "@/components/primitives/Card";
import type { ResultSummary } from "@/lib/assessment-engine/types";
import { copy } from "@/lib/design/copy";

export function ResultHero({ row }: { row: ResultSummary }) {
  return (
    <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-brand-300">{copy.results.finalScore}</p>
        <h2 className="font-display text-3xl text-white">
          {row.pass ? "Pass" : row.borderline ? "Borderline Review" : "Fail"}
        </h2>
        <p className="text-slate-200">
          Core {row.corePercent.toFixed(1)}% | Practical {row.practicalPercent.toFixed(1)}%
        </p>
      </div>
      <ScoreReveal value={row.finalPercent} />
    </Card>
  );
}
