import { ScoreReveal } from "@/components/motion/ScoreReveal";
import { Card } from "@/components/primitives/Card";
import type { ResultSummary } from "@/lib/assessment-engine/types";
import { copy } from "@/lib/design/copy";

export function ResultHero({ row }: { row: ResultSummary }) {
  const sectionText = row.sections
    .map((sectionId) => row.sectionBreakdown[sectionId])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => `${entry.label} ${entry.percent.toFixed(1)}% ${entry.pass ? "Pass" : "Fail"}`)
    .join(" | ");

  return (
    <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-brand-300">{copy.results.finalScore}</p>
        <h2 className="font-display text-3xl text-white">
          {row.pass ? "Pass" : row.borderline ? "Borderline Review" : "Fail"}
        </h2>
        <p className="text-slate-200">{sectionText || "No addon data"}</p>
      </div>
      <ScoreReveal value={row.finalPercent} />
    </Card>
  );
}
