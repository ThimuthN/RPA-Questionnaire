import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import {
  getDetailedResult,
  getNextUnreviewedAttemptId,
  getResultCandidateLinkOptions,
  getScoreContextForAttempt,
  type ResultCandidateLinkTarget
} from "@/lib/db/repositories";
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
import { candidateMilestoneTypeLabels } from "@/lib/candidates/milestones";
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

function linkTargetOptionLabel(target: ResultCandidateLinkTarget) {
  const parts = [
    target.candidateName,
    target.candidateEmail,
    target.candidateRoleLabel,
    candidateMilestoneTypeLabels[target.milestoneType as keyof typeof candidateMilestoneTypeLabels] ?? target.milestoneTitle
  ].filter(Boolean);

  return parts.join(" | ");
}

function isSuggestedLinkTarget(target: ResultCandidateLinkTarget) {
  return target.matchesParticipantEmail || target.matchesParticipantName;
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
  const [candidate, nextUnreviewedId, scoreContext, linkOptions] = await Promise.all([
    row.candidateId ? getCandidateDetail(row.candidateId) : Promise.resolve(null),
    getNextUnreviewedAttemptId(attemptId),
    getScoreContextForAttempt(attemptId, row.finalPercent),
    row.candidateId ? Promise.resolve(null) : getResultCandidateLinkOptions(attemptId)
  ]);
  const activity = candidate ? buildCandidateActivityFeed(candidate).slice(0, 5) : [];
  const suggestedTargets = linkOptions?.targets.filter(isSuggestedLinkTarget).slice(0, 3) ?? [];
  const suggestedTargetIds = new Set(suggestedTargets.map((target) => target.milestoneId));
  const remainingTargets =
    linkOptions?.targets.filter((target) => !suggestedTargetIds.has(target.milestoneId)) ?? [];
  const selectTargets = suggestedTargets.length > 0 ? remainingTargets : linkOptions?.targets ?? [];

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
      {pageState.linked ? (
        <div className="mb-5 rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] p-4 text-sm text-[color:var(--app-success)]">
          Result linked to the selected candidate milestone.
        </div>
      ) : null}
      {pageState.updated ? (
        <div className="mb-5 rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] p-4 text-sm text-[color:var(--app-success)]">
          Updated {pageState.updated} candidate-linked result(s).
        </div>
      ) : null}
      {pageState.error ? (
        <div className="mb-5 rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-4 text-sm text-[color:var(--app-danger)]">
          {pageState.error}
        </div>
      ) : null}
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
                <p className="text-sm text-[color:var(--app-text)]">Bring the candidate state into the review instead of switching screens.</p>
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
                  <p className="text-sm text-[color:var(--app-text)]">{candidate.email}</p>
                  {candidate.notesSummary ? <p className="text-sm text-[color:var(--app-text)]">{candidate.notesSummary}</p> : null}
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
                <div id="link-candidate" className="mt-4 space-y-4">
                  <p className="text-sm text-[color:var(--app-text)]">This result is not linked to a tracked candidate yet.</p>

                  {linkOptions && !linkOptions.canLink ? (
                    <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 text-sm text-[color:var(--app-text)]">
                      {linkOptions.reason || "This result cannot be linked from here yet."}
                    </div>
                  ) : null}

                  {suggestedTargets.length > 0 ? (
                    <div className="space-y-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
                      <div className="space-y-1">
                        <h3 className="text-base text-[color:var(--app-heading)]">Suggested matches</h3>
                        <p className="text-sm text-[color:var(--app-text)]">These candidates match the participant details on this result.</p>
                      </div>
                      <div className="space-y-3">
                        {suggestedTargets.map((target) => (
                          <form
                            key={target.milestoneId}
                            action={`/api/results/${attemptId}/link`}
                            method="post"
                            className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3"
                          >
                            <input type="hidden" name="milestoneId" value={target.milestoneId} />
                            <input type="hidden" name="returnTo" value={`/results/${attemptId}#link-candidate`} />
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-medium text-[color:var(--app-heading)]">{target.candidateName}</p>
                              <p className="text-sm text-[color:var(--app-text)]">
                                {target.candidateEmail}{" "}
                                {target.candidateRoleLabel ? `| ${target.candidateRoleLabel}` : ""}
                              </p>
                              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                                {candidateMilestoneTypeLabels[target.milestoneType as keyof typeof candidateMilestoneTypeLabels] ?? target.milestoneTitle}
                              </p>
                            </div>
                            <Button type="submit">Link</Button>
                          </form>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selectTargets.length > 0 ? (
                    <form
                      action={`/api/results/${attemptId}/link`}
                      method="post"
                      className="space-y-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4"
                    >
                      <input type="hidden" name="returnTo" value={`/results/${attemptId}#link-candidate`} />
                      <div className="space-y-1">
                        <h3 className="text-base text-[color:var(--app-heading)]">
                          {suggestedTargets.length > 0 ? "Other candidate milestones" : "Link to candidate milestone"}
                        </h3>
                        <p className="text-sm text-[color:var(--app-text)]">
                          Choose the candidate step that should own this result.
                        </p>
                      </div>
                      <label className="grid gap-2">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Candidate milestone</span>
                        <select
                          name="milestoneId"
                          required
                          defaultValue={selectTargets[0]?.milestoneId ?? ""}
                          className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        >
                          {selectTargets.map((target) => (
                            <option key={target.milestoneId} value={target.milestoneId}>
                              {linkTargetOptionLabel(target)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button type="submit">Link result</Button>
                    </form>
                  ) : null}

                  {linkOptions?.canLink && linkOptions.targets.length === 0 && linkOptions.reason ? (
                    <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 text-sm text-[color:var(--app-text)]">
                      {linkOptions.reason}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Recent activity</h2>
                <p className="text-sm text-[color:var(--app-text)]">Latest notes and candidate events.</p>
              </div>
              {activity.length === 0 ? (
                <p className="mt-4 text-sm text-[color:var(--app-text)]">No recent candidate activity available.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {activity.map((item) => (
                    <div key={item.id} className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill label={item.kind} tone="neutral" />
                        <StatusPill label={new Date(item.at).toLocaleString()} tone="neutral" />
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--app-heading)]">{item.title}</p>
                      <p className="mt-1 text-sm text-[color:var(--app-text)]">{item.detail}</p>
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
