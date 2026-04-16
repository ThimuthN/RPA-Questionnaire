import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { assessmentContextTypeValues, type AssessmentContextType, resultReviewStateValues, type ResultReviewState } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import { ResultsWorkspaceTable } from "@/components/results/ResultsWorkspaceTable";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { StatusPill } from "@/components/primitives/StatusPill";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { PersistedTableState } from "@/components/workspace/PersistedTableState";
import { SavedViewNotice } from "@/components/workspace/SavedViewNotice";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { ResultsFiltersModal } from "@/components/results/ResultsFiltersModal";
import { requirePageSession } from "@/lib/auth/guards";
import { candidateStageLabels, candidateStageValues, type CandidateUiStatus } from "@/lib/candidates/types";
import { listResultWorkspacePage } from "@/lib/db/repositories";
import { integrityRiskLevelValues, parseResultsWorkspaceQuery, resultScoreBandValues, toResultsWorkspaceSearchParams } from "@/lib/results/query";
import type { IntegrityRiskLevel, ResultStatusFilter } from "@/lib/results/triage";
import type { ResultScoreBand, WorkspaceResultRow } from "@/lib/results/workspace";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const integrityOptions: IntegrityRiskLevel[] = [...integrityRiskLevelValues];
const reviewStateOptions: ResultReviewState[] = [...resultReviewStateValues];
const contextTypeOptions: AssessmentContextType[] = [...assessmentContextTypeValues];
const scoreBandOptions: ResultScoreBand[] = [...resultScoreBandValues];

type PageState = {
  deleted?: string;
  error?: string;
  updated?: string;
  q?: string;
  status?: string;
  reviewState?: string;
  contextType?: string;
  integrity?: string;
  role?: string;
  owner?: string;
  stage?: string;
  scoreBand?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
  compare?: string;
};

const transientBannerKeys = ["deleted", "error", "updated"] as const;

function buildHref(params: URLSearchParams, overrides: Record<string, string | undefined>): Route {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  return `/results${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

function compareIdsFromRaw(raw?: string) {
  return [...new Set(String(raw || "").split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 4);
}

function toneForStatus(status: ResultStatusFilter) {
  return status === "pass" ? "emerald" : status === "review" ? "amber" : "red";
}

function reviewStateTone(state: ResultReviewState) {
  if (state === "reviewed") return "emerald";
  if (state === "flagged") return "amber";
  return "neutral";
}

function reviewStateLabel(state: ResultReviewState) {
  if (state === "reviewed") return "Reviewed";
  if (state === "flagged") return "Flagged";
  return "Unreviewed";
}

function contextTypeLabel(type: AssessmentContextType) {
  if (type === "hiring") return "Hiring";
  if (type === "promotion") return "Promotion";
  if (type === "training") return "Training";
  if (type === "certification") return "Certification";
  return "General";
}

function linkedWorkflowSummary(row: WorkspaceResultRow) {
  if (!row.candidateId) return "Assessment-only result";
  const details = [
    row.candidateStage ? candidateStageLabels[row.candidateStage] : null,
    row.candidateOwner ? `Owner ${row.candidateOwner}` : null
  ].filter(Boolean);
  return details.length > 0 ? details.join(" | ") : "Linked profile record";
}

const filterControlClass =
  "w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60";

const filterInputClass =
  "w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60";

function FilterField({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{label}</span>
      {children}
    </label>
  );
}

function countAdvancedFilters(state: PageState) {
  return [
    state.reviewState,
    state.contextType,
    state.integrity,
    state.role,
    state.owner,
    state.stage,
    state.scoreBand
  ].filter((value) => typeof value === "string" && value.length > 0).length;
}

function NoticeBanner({
  tone,
  children
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  return (
    <div
      className={
        tone === "success"
          ? "rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] p-4 text-sm text-[color:var(--app-success)]"
          : "rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-4 text-sm text-[color:var(--app-danger)]"
      }
    >
      {children}
    </div>
  );
}

function CompareResultCard({ row }: { row: WorkspaceResultRow }) {
  return (
    <div
      className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-lg text-[color:var(--app-heading)]">{row.candidateName || "Unnamed participant"}</p>
          <p className="text-sm text-[color:var(--app-muted)]">{row.candidateEmail || "No email"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={row.resultStatus} tone={toneForStatus(row.resultStatus)} />
          <StatusPill label={reviewStateLabel(row.reviewState)} tone={reviewStateTone(row.reviewState)} />
          <StatusPill label={`${row.finalPercent.toFixed(1)} / 100`} tone="blue" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-[color:var(--app-text)]">{row.candidateRoleLabel || "General assessment"}</p>
          <p className="text-sm text-[color:var(--app-muted)]">{linkedWorkflowSummary(row)}</p>
        </div>
        <Link href={`/results/${row.attemptId}`}>
          <Button variant="secondary">View result</Button>
        </Link>
      </div>
    </div>
  );
}

export default async function ResultsPage({
  searchParams
}: {
  searchParams: Promise<PageState>;
}) {
  const pageState = await searchParams;
  const persistentState = Object.fromEntries(
    Object.entries(pageState).filter(
      ([key, value]) =>
        typeof value === "string" &&
        value.length > 0 &&
        !transientBannerKeys.includes(key as (typeof transientBannerKeys)[number])
    )
  ) as Record<string, string>;
  const query = toResultsWorkspaceSearchParams(persistentState);
  const nextPath = `/results${query.toString() ? `?${query.toString()}` : ""}`;
  await requirePageSession(nextPath);
  const page = await listResultWorkspacePage(parseResultsWorkspaceQuery(pageState));
  const currentPathAndQuery = nextPath;
  const compareIds = compareIdsFromRaw(pageState.compare);
  const comparison =
    compareIds.length > 0
      ? await listResultWorkspacePage({
          attemptIds: compareIds,
          page: 1,
          pageSize: compareIds.length
        })
      : null;
  const advancedFilterCount = countAdvancedFilters(pageState);

  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="Assessment review"
        title="Results"
        subtitle="Review assessment outcomes."
        utility={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`Pass ${page.statusCounts.pass}`} tone="emerald" />
            <StatusPill label={`Review ${page.statusCounts.review}`} tone="amber" />
            <StatusPill label={`Fail ${page.statusCounts.fail}`} tone="red" />
            <a href={`/api/results/export.csv${query.toString() ? `?${query.toString()}` : ""}`}>
              <Button variant="secondary">Export CSV</Button>
            </a>
            <a href={`/api/results/export.json${query.toString() ? `?${query.toString()}` : ""}`}>
              <Button variant="secondary">Export JSON</Button>
            </a>
          </div>
        }
      >
        <PersistedTableState
          storageKey="results-table-view"
          transientKeys={[...transientBannerKeys]}
        />
        <StaggerGroup className="space-y-5" delay={0.04}>
          <StaggerItem>
            <SavedViewNotice storageId="results" currentPathAndQuery={currentPathAndQuery} />
          </StaggerItem>

          {pageState.deleted ? (
            <StaggerItem>
              <NoticeBanner tone="success">Result deleted.</NoticeBanner>
            </StaggerItem>
          ) : null}
          {pageState.updated ? (
            <StaggerItem>
              <NoticeBanner tone="success">Updated {pageState.updated} record(s).</NoticeBanner>
            </StaggerItem>
          ) : null}
          {pageState.error ? (
            <StaggerItem>
              <NoticeBanner tone="error">{pageState.error}</NoticeBanner>
            </StaggerItem>
          ) : null}

          {comparison && comparison.rows.length > 0 ? (
            <StaggerItem>
              <StagePanel tone="summary" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-2xl text-[color:var(--app-heading)]">Compare results</h2>
                    <p className="text-sm text-[color:var(--app-muted)]">
                      {comparison.rows.length} selected for side-by-side review.
                    </p>
                  </div>
                  <Link href={buildHref(query, { compare: undefined })}>
                    <Button variant="secondary">Clear compare</Button>
                  </Link>
                </div>
                <div className="grid gap-4 xl:grid-cols-4">
                  {comparison.rows.map((row) => (
                    <CompareResultCard key={row.attemptId} row={row} />
                  ))}
                </div>
              </StagePanel>
            </StaggerItem>
          ) : null}

          <StaggerItem>
            <StagePanel tone="summary" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-[color:var(--app-heading)]">Find results</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Search quickly, then use advanced filters only when you need them.</p>
              </div>
              <form className="space-y-4">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto_auto_auto]">
                  <FilterField label="Search" className="xl:col-span-1">
                    <input
                      name="q"
                      defaultValue={pageState.q ?? ""}
                      placeholder="Participant, email, owner, or notes"
                      className={filterInputClass}
                    />
                  </FilterField>
                  <FilterField label="Sort">
                    <select name="sort" defaultValue={pageState.sort ?? "newest"} className={filterControlClass}>
                      <option value="newest">Newest</option>
                      <option value="score_desc">Score high to low</option>
                      <option value="score_asc">Score low to high</option>
                      <option value="risk_desc">Integrity risk</option>
                      <option value="stale_desc">Most stale linked workflow</option>
                    </select>
                  </FilterField>
                  <FilterField label="Result">
                    <select name="status" defaultValue={pageState.status ?? ""} className={filterControlClass}>
                      <option value="">All results</option>
                      <option value="pass">Pass</option>
                      <option value="review">Review</option>
                      <option value="fail">Fail</option>
                    </select>
                  </FilterField>
                  <input type="hidden" name="reviewState" value={pageState.reviewState ?? ""} />
                  <input type="hidden" name="contextType" value={pageState.contextType ?? ""} />
                  <input type="hidden" name="integrity" value={pageState.integrity ?? ""} />
                  <input type="hidden" name="role" value={pageState.role ?? ""} />
                  <input type="hidden" name="owner" value={pageState.owner ?? ""} />
                  <input type="hidden" name="stage" value={pageState.stage ?? ""} />
                  <input type="hidden" name="scoreBand" value={pageState.scoreBand ?? ""} />
                  <input type="hidden" name="pageSize" value={pageState.pageSize ?? String(page.pageSize)} />
                  <input type="hidden" name="compare" value={pageState.compare ?? ""} />
                  <div className="flex items-end">
                    <Button>Apply</Button>
                  </div>
                  <div className="flex items-end">
                    <ResultsFiltersModal
                      advancedCount={advancedFilterCount}
                      current={{
                        q: pageState.q,
                        sort: pageState.sort,
                        status: pageState.status,
                        reviewState: pageState.reviewState,
                        contextType: pageState.contextType,
                        integrity: pageState.integrity,
                        role: pageState.role,
                        owner: pageState.owner,
                        stage: pageState.stage,
                        scoreBand: pageState.scoreBand,
                        pageSize: pageState.pageSize ?? String(page.pageSize),
                        compare: pageState.compare
                      }}
                      roleOptions={page.roleOptions.map((role) => ({ value: role.id, label: role.label }))}
                      ownerOptions={page.ownerOptions.map((owner) => ({ value: owner, label: owner }))}
                      stageOptions={candidateStageValues.map((stage) => ({ value: stage, label: candidateStageLabels[stage] }))}
                      reviewStateOptions={reviewStateOptions.map((state) => ({ value: state, label: reviewStateLabel(state) }))}
                      contextTypeOptions={contextTypeOptions.map((type) => ({ value: type, label: contextTypeLabel(type) }))}
                      integrityOptions={integrityOptions.map((level) => ({ value: level, label: level === "clean" ? "Clean" : level === "watch" ? "Watch" : "Review" }))}
                      scoreBandOptions={scoreBandOptions.map((band) => ({ value: band, label: band === "high" ? "High" : band === "mid" ? "Mid" : "Low" }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Link href="/results">
                      <Button type="button" variant="secondary">Reset</Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--app-border)] pt-1">
                  <Link href={buildHref(query, { status: "review", sort: "newest", page: "1" })}>
                    <Button type="button" variant="ghost">Review needed</Button>
                  </Link>
                </div>
              </form>
            </StagePanel>
          </StaggerItem>

          {page.rows.length === 0 ? (
            <StaggerItem>
              <StagePanel tone="summary" className="space-y-4">
                <h2 className="text-2xl text-[color:var(--app-heading)]">No results match this view</h2>
                <p className="text-[color:var(--app-text)]">Try clearing a filter or running a new assessment.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/assessments">
                    <Button>Open assessments</Button>
                  </Link>
                  <Link href="/results?clearView=1">
                    <Button variant="secondary">Reset filters</Button>
                  </Link>
                </div>
              </StagePanel>
            </StaggerItem>
          ) : (
            <StaggerItem>
              <ResultsWorkspaceTable
                rows={page.rows}
                currentPathAndQuery={currentPathAndQuery}
                currentQueryString={query.toString()}
                compareIds={compareIds}
              />
            </StaggerItem>
          )}

          <StaggerItem>
            <PaginationBar
              page={page.page}
              pageSize={page.pageSize}
              total={page.total}
              makeHref={(nextPage) => buildHref(query, { page: String(nextPage) })}
            />
          </StaggerItem>
        </StaggerGroup>
      </SceneShell>
    </SceneTransition>
  );
}
