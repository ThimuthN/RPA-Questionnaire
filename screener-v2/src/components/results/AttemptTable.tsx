import Link from "next/link";
import { ActionRow } from "@/components/dashboard/ActionRow";
import { Button } from "@/components/primitives/Button";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import type { ResultSummary } from "@/lib/assessment-engine/types";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import { copy } from "@/lib/design/copy";
import { getIntegrityRiskLevel } from "@/lib/results/triage";

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

function integrityLabel(row: ResultSummary) {
  const level = getIntegrityRiskLevel(row);
  if (level === "review") return "Review";
  if (level === "watch") return "Watch";
  return "Clean";
}

function integrityTone(row: ResultSummary) {
  const level = getIntegrityRiskLevel(row);
  if (level === "review") return "red" as const;
  if (level === "watch") return "amber" as const;
  return "emerald" as const;
}

function primaryActionLabel(row: ResultSummary) {
  return row.borderline || getIntegrityRiskLevel(row) === "review" ? "Review now" : "Open result";
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
      {rows.map((row) => {
        const integrityLevel = getIntegrityRiskLevel(row);
        const nextAction = primaryActionLabel(row);
        const tone = row.borderline || integrityLevel === "review" ? "attention" : row.pass ? "positive" : "standard";

        return (
          <ActionRow
            key={row.attemptId}
            tone={tone}
            badges={
              <>
                <StatusPill label={statusLabel(row)} tone={row.pass ? "emerald" : row.borderline ? "amber" : "red"} />
                <StatusPill label={row.roleId} tone="neutral" />
                <StatusPill label={`Integrity ${integrityLabel(row)}`} tone={integrityTone(row)} />
              </>
            }
            title={row.candidateName || "Unnamed candidate"}
            subtitle={row.candidateEmail || "No email captured"}
            description={sectionSummary(row)}
            meta={
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>Next action {nextAction}</span>
                <span>
                  Signals Tabs hidden {row.integrity.tabHiddenCount} | Copy/Cut {row.integrity.copyCount} | Paste{" "}
                  {row.integrity.pasteCount}
                </span>
                <Link
                  className="font-mono text-slate-300 underline-offset-4 hover:text-white hover:underline"
                  href={`/results/${row.attemptId}`}
                >
                  {row.attemptId.slice(0, 12)}
                </Link>
              </div>
            }
            metrics={[
              {
                label: copy.results.finalScore,
                value: `${row.finalPercent.toFixed(1)} / 100`,
                hint: `Outcome ${statusLabel(row)}`
              },
              {
                label: "Integrity risk",
                value: integrityLabel(row),
                hint: integrityLevel === "clean" ? "No unusual activity flagged." : "Review the integrity trail before deciding."
              }
            ]}
            actions={
              <>
                <Link href={`/results/${row.attemptId}`}>
                  <Button>{nextAction}</Button>
                </Link>
                <form action={`/api/results/${row.attemptId}/delete`} method="post">
                  <ConfirmSubmitButton
                    variant="ghost"
                    className="text-red-200 hover:bg-red-500/10"
                    confirmMessage={`Delete the result for ${row.candidateName || "this candidate"}? This removes the saved result and attempt.`}
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </>
            }
          />
        );
      })}
    </div>
  );
}
