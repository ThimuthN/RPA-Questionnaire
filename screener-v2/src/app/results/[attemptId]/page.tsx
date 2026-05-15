import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import {
  getDetailedResult,
  getNextUnreviewedAttemptId,
  getScoreContextForAttempt
} from "@/lib/db/repositories";
import { ResultDecisionActions } from "@/components/results/ResultDecisionActions";
import { ResultActivityModal } from "@/components/results/ResultActivityModal";
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
    confidence,
    integrity
  };
}

function NoticeBanner({
  tone,
  children
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const className =
    tone === "success"
      ? "mb-5 rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] p-4 text-sm text-[color:var(--app-success)]"
      : "mb-5 rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-4 text-sm text-[color:var(--app-danger)]";

  return <div className={className}>{children}</div>;
}

export default async function ResultDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ linked?: string; updated?: string; error?: string }>;
}) {
  const { attemptId } = await params;
  await requirePageSession(`/results/${attemptId}`);
  const pageState = await searchParams;
  const result = await getDetailedResult(attemptId);
  if (!result) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl text-[color:var(--app-heading)]">Result not found</h1>
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
      {pageState.linked ? <NoticeBanner tone="success">Result linked to the selected candidate milestone.</NoticeBanner> : null}
      {pageState.updated ? <NoticeBanner tone="success">Updated {pageState.updated} candidate-linked result(s).</NoticeBanner> : null}
      {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}
      <DecisionStage
        hero={<ResultRevealHero row={row} />}
        signals={
          <>
            <SignalCard label={copy.results.confidence} value={signals.confidence} tone="blue" />
            <SignalCard label="Integrity" value={signals.integrity} tone="amber" />
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
            <ResultReviewSections sections={result.reviewSections} examBreakdown={row.examBreakdown} />
          </div>

          <div className="space-y-5">
            <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Candidate context</h2>
                <p className="text-sm text-[color:var(--app-text)]">Keep only the candidate context that helps this decision.</p>
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
                  {candidate.notesSummary ? (
                    <div className="space-y-1 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Decision summary</p>
                      <p className="text-sm leading-6 text-[color:var(--app-text)]">{candidate.notesSummary}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[color:var(--app-text)]">This result is linked and ready for a decision.</p>
                  )}
                  <div className="grid gap-2 border-t border-[color:var(--app-border)] pt-4 sm:grid-cols-2">
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
                <p className="mt-4 text-sm text-[color:var(--app-text)]">
                  This result is not linked to a candidate. Create or attach a test from a candidate profile to link it.
                </p>
              )}
            </div>

            <ResultActivityModal items={activity} />
          </div>
        </div>
      </DecisionStage>
      <StickyDecisionBar
        attemptId={attemptId}
        hasLinkedCandidate={!!candidate}
        nextUnreviewedId={nextUnreviewedId ?? undefined}
      />
    </SceneShell>
  );
}
