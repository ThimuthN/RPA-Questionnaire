import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { getDetailedResult, getNextUnreviewedAttemptId, getScoreContextForAttempt } from "@/lib/db/repositories";
import { ResultDecisionActions } from "@/components/results/ResultDecisionActions";
import { ResultRevealHero } from "@/components/results/ResultRevealHero";
import { ResultReviewSections } from "@/components/results/ResultReviewSections";
import { StickyDecisionBar } from "@/components/results/StickyDecisionBar";
import { SignalCard } from "@/components/primitives/SignalCard";
import { SceneShell } from "@/components/scene/SceneShell";
import { DecisionStage } from "@/components/results/DecisionStage";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import { StatusPill } from "@/components/primitives/StatusPill";
import { copy } from "@/lib/design/copy";
import type { ResultSummary } from "@/lib/assessment-engine/types";
import { confidenceBand } from "@/lib/assessment-engine/thresholds";
import { buildCandidateActivityFeed } from "@/lib/candidates/workspace";
import { candidateStageLabels, candidateUiStatusLabels } from "@/lib/candidates/types";
import { requirePageSession } from "@/lib/auth/guards";
import { getCandidateDetail } from "@/lib/db/candidates";

export const dynamic = "force-dynamic";

function getSignals(row: ResultSummary) {
  const entries = Object.entries(row.breakdownByCategory).sort((a, b) => b[1].percent - a[1].percent);
  const best = entries[0];
  const weakest = entries[entries.length - 1];
  const band = confidenceBand(row.finalPercent, row.passPercent, row.integrity, row.borderline);
  const confidence =
    band === "high"
      ? "Strong pass confidence"
      : band === "medium"
        ? "Moderate confidence"
        : "Integrity or borderline signals need review";
  const integrity =
    row.integrity.tabHiddenCount + row.integrity.copyCount + row.integrity.pasteCount === 0
      ? "No integrity events recorded"
      : `Tabs hidden ${row.integrity.tabHiddenCount}, copy/cut ${row.integrity.copyCount}, paste ${row.integrity.pasteCount}`;

  return {
    strength: best ? `${best[0]} (${best[1].percent.toFixed(1)}%)` : "No category data yet",
    risk: weakest ? `${weakest[0]} (${weakest[1].percent.toFixed(1)}%)` : "No category risk",
    confidence,
    integrity
  };
}

export default async function ResultDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { attemptId } = await params;
  await requirePageSession(`/results/${attemptId}`);
  const pageState = await searchParams;
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
  const [candidate, nextUnreviewedId, scoreContext] = await Promise.all([
    row.candidateId ? getCandidateDetail(row.candidateId) : Promise.resolve(null),
    getNextUnreviewedAttemptId(attemptId),
    getScoreContextForAttempt(attemptId, row.finalPercent)
  ]);
  const activity = candidate ? buildCandidateActivityFeed(candidate).slice(0, 5) : [];

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
          {nextUnreviewedId && nextUnreviewedId !== attemptId && (
            <Link href={`/results/${nextUnreviewedId}`}>
              <Button variant="secondary">Next unreviewed -&gt;</Button>
            </Link>
          )}
          <form action={`/api/results/${attemptId}/delete`} method="post">
            <ConfirmSubmitButton
              variant="danger"
              confirmMessage={`Delete the result for ${row.candidateName || "this candidate"}? This removes the saved result and attempt.`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
          <a href="/api/results/export.csv">
            <Button>Export CSV</Button>
          </a>
          <a href="/api/results/export.json">
            <Button variant="secondary">Export JSON</Button>
          </a>
        </div>
      }
    >
      {pageState.updated ? (
        <div className="mb-5 rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Updated {pageState.updated} candidate-linked result(s).
        </div>
      ) : null}
      {pageState.error ? (
        <div className="mb-5 rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {pageState.error}
        </div>
      ) : null}
      <DecisionStage
        hero={<ResultRevealHero row={row} />}
        signals={
          <>
            <SignalCard label={copy.results.topStrength} value={signals.strength} tone="emerald" />
            <SignalCard label={copy.results.mainRisk} value={signals.risk} tone="amber" />
            <SignalCard label={copy.results.confidence} value={signals.confidence} tone="blue" />
            <SignalCard label="Integrity" value={signals.integrity} tone="amber" className="md:col-span-2" />
            {scoreContext.label ? (
              <SignalCard
                label="Role benchmark"
                value={scoreContext.label}
                tone={scoreContext.percentile !== null && scoreContext.percentile >= 50 ? "emerald" : "amber"}
              />
            ) : null}
          </>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
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
            <ResultReviewSections sections={result.reviewSections} examBreakdown={row.examBreakdown} />
          </div>

          <div className="space-y-5">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="space-y-1">
                <h2 className="text-xl text-white">Candidate context</h2>
                <p className="text-sm text-slate-300">Bring the candidate state into the review instead of switching screens.</p>
              </div>
              {candidate ? (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {row.candidateUiStatus ? (
                      <StatusPill label={candidateUiStatusLabels[row.candidateUiStatus]} tone={row.candidateUiStatus === "moved_forward" ? "emerald" : row.candidateUiStatus === "need_review" ? "amber" : row.candidateUiStatus === "rejected" ? "red" : "blue"} />
                    ) : null}
                    {row.candidateStage ? (
                      <StatusPill label={candidateStageLabels[row.candidateStage]} tone="neutral" />
                    ) : null}
                    {row.candidateOwner ? <StatusPill label={`Owner ${row.candidateOwner}`} tone="neutral" className="normal-case tracking-normal" /> : null}
                  </div>
                  <p className="text-sm text-slate-300">{candidate.email}</p>
                  {candidate.notesSummary ? <p className="text-sm text-brand-100">{candidate.notesSummary}</p> : null}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ResultDecisionActions
                      attemptId={attemptId}
                      renderAction={(action) => (
                        <Button type="submit" variant={action.buttonVariant}>
                          {action.label}
                        </Button>
                      )}
                    />
                    <Link href={`/candidates/${candidate.id}`}>
                      <Button variant="secondary">Open candidate</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-300">This result is not linked to a tracked candidate yet.</p>
              )}
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="space-y-1">
                <h2 className="text-xl text-white">Recent activity</h2>
                <p className="text-sm text-slate-300">Latest notes and candidate events.</p>
              </div>
              {activity.length === 0 ? (
                <p className="mt-4 text-sm text-slate-300">No recent candidate activity available.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {activity.map((item) => (
                    <div key={item.id} className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill label={item.kind} tone="neutral" />
                        <StatusPill label={new Date(item.at).toLocaleString()} tone="neutral" />
                      </div>
                      <p className="mt-2 text-sm text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DecisionStage>
      <StickyDecisionBar
        attemptId={attemptId}
        candidateName={row.candidateName || `Attempt ${attemptId.slice(0, 12)}`}
        score={row.finalPercent}
        resultStatus={row.pass ? "pass" : row.borderline ? "review" : "fail"}
        hasLinkedCandidate={!!candidate}
        nextUnreviewedId={nextUnreviewedId ?? undefined}
      />
    </SceneShell>
  );
}
