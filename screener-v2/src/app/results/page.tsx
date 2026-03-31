import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import {
  assessmentContextTypeValues,
  type AssessmentContextType,
  resultReviewStateValues,
  type ResultReviewState
} from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import { BulkReviewControls } from "@/components/results/BulkReviewControls";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { StatusPill } from "@/components/primitives/StatusPill";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { SavedViewNotice } from "@/components/workspace/SavedViewNotice";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { ResultsFiltersModal } from "@/components/results/ResultsFiltersModal";
import { requirePageSession } from "@/lib/auth/guards";
import { candidateStageLabels, candidateStageValues, type CandidateStage, type CandidateUiStatus } from "@/lib/candidates/types";
import { listResultWorkspacePage } from "@/lib/db/repositories";
import type { IntegrityRiskLevel, ResultStatusFilter } from "@/lib/results/triage";
import type { ResultListSort, ResultScoreBand, WorkspaceResultRow } from "@/lib/results/workspace";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusOptions: ResultStatusFilter[] = ["pass", "review", "fail"];
const integrityOptions: IntegrityRiskLevel[] = ["clean", "watch", "review"];
const reviewStateOptions: ResultReviewState[] = [...resultReviewStateValues];
const contextTypeOptions: AssessmentContextType[] = [...assessmentContextTypeValues];
const scoreBandOptions: ResultScoreBand[] = ["high", "mid", "low"];

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

function toggleCompare(params: URLSearchParams, attemptId: string) {
  const ids = compareIdsFromRaw(params.get("compare") || "");
  const nextIds = ids.includes(attemptId) ? ids.filter((id) => id !== attemptId) : [...ids, attemptId].slice(0, 4);
  return buildHref(params, { compare: nextIds.length > 0 ? nextIds.join(",") : undefined });
}

function toneForStatus(status: ResultStatusFilter) {
  return status === "pass" ? "emerald" : status === "review" ? "amber" : "red";
}

function toneForIntegrity(level: IntegrityRiskLevel) {
  return level === "clean" ? "emerald" : level === "watch" ? "amber" : "red";
}

function toneForLinkedStatus(status: CandidateUiStatus) {
  if (status === "moved_forward") return "emerald";
  if (status === "need_review") return "amber";
  if (status === "rejected") return "red";
  return "blue";
}

function linkedStatusLabel(status: CandidateUiStatus) {
  if (status === "moved_forward") return "Advanced";
  if (status === "need_review") return "Needs review";
  if (status === "rejected") return "Closed";
  return "In progress";
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

function strongestArea(row: WorkspaceResultRow) {
  return Object.entries(row.breakdownByCategory).sort((left, right) => right[1].percent - left[1].percent)[0]?.[0] ?? "No data";
}

function stackSummary(row: WorkspaceResultRow) {
  if (row.stacks.length === 0) return "General";
  if (row.stacks.length === 1) return row.stacks[0];
  return `${row.stacks[0]} +${row.stacks.length - 1}`;
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

const resultsTableCellClassName = "px-4 py-4 align-middle text-sm";
const inlineActionClassName =
  "text-sm font-medium text-[color:var(--app-brand-strong)] transition hover:text-[color:var(--app-brand)]";

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

export default async function ResultsPage({
  searchParams
}: {
  searchParams: Promise<PageState>;
}) {
  const pageState = await searchParams;
  const query = new URLSearchParams(
    Object.entries(pageState)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, value as string])
  );
  const nextPath = `/results${query.toString() ? `?${query.toString()}` : ""}`;
  await requirePageSession(nextPath);
  const page = await listResultWorkspacePage({
    q: pageState.q?.trim() || undefined,
    status: statusOptions.includes(pageState.status as ResultStatusFilter)
      ? (pageState.status as ResultStatusFilter)
      : undefined,
    reviewState: reviewStateOptions.includes(pageState.reviewState as ResultReviewState)
      ? (pageState.reviewState as ResultReviewState)
      : undefined,
    contextType: contextTypeOptions.includes(pageState.contextType as AssessmentContextType)
      ? (pageState.contextType as AssessmentContextType)
      : undefined,
    integrity: integrityOptions.includes(pageState.integrity as IntegrityRiskLevel)
      ? (pageState.integrity as IntegrityRiskLevel)
      : undefined,
    role: pageState.role?.trim() || undefined,
    owner: pageState.owner?.trim() || undefined,
    stage: candidateStageValues.includes(pageState.stage as CandidateStage)
      ? (pageState.stage as CandidateStage)
      : undefined,
    scoreBand: scoreBandOptions.includes(pageState.scoreBand as ResultScoreBand)
      ? (pageState.scoreBand as ResultScoreBand)
      : undefined,
    sort: (pageState.sort as ResultListSort) || "newest",
    page: Number(pageState.page ?? 1),
    pageSize: Number(pageState.pageSize ?? 12)
  });
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
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`Pass ${page.statusCounts.pass}`} tone="emerald" />
            <StatusPill label={`Review ${page.statusCounts.review}`} tone="amber" />
            <StatusPill label={`Fail ${page.statusCounts.fail}`} tone="red" />
          </div>
        }
      >
        <StaggerGroup className="space-y-5" delay={0.04}>
          <StaggerItem>
            <SavedViewNotice storageId="results" currentPathAndQuery={currentPathAndQuery} />
          </StaggerItem>

          {pageState.deleted ? (
            <StaggerItem>
              <div className="rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] p-4 text-sm text-[color:var(--app-success)]">
                Result deleted.
              </div>
            </StaggerItem>
          ) : null}
          {pageState.updated ? (
            <StaggerItem>
              <div className="rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] p-4 text-sm text-[color:var(--app-success)]">
                Updated {pageState.updated} record(s).
              </div>
            </StaggerItem>
          ) : null}
          {pageState.error ? (
            <StaggerItem>
              <div className="rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-4 text-sm text-[color:var(--app-danger)]">
                {pageState.error}
              </div>
            </StaggerItem>
          ) : null}

          {comparison && comparison.rows.length > 0 ? (
            <StaggerItem>
              <StagePanel tone="summary" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-2xl text-[color:var(--app-heading)]">Compare results</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Compare up to four results side by side.</p>
              </div>
              <Link href={buildHref(query, { compare: undefined })}>
                <Button variant="secondary">Clear compare</Button>
              </Link>
            </div>
            <div className="grid gap-4 xl:grid-cols-4">
              {comparison.rows.map((row) => (
                <div
                  key={row.attemptId}
                  className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
                >
                  <div className="space-y-2">
                    <p className="text-lg text-[color:var(--app-heading)]">{row.candidateName || "Unnamed participant"}</p>
                    <p className="text-sm text-[color:var(--app-muted)]">{row.candidateEmail || "No email"}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={contextTypeLabel(row.contextType)} tone="neutral" />
                      <StatusPill label={reviewStateLabel(row.reviewState)} tone={reviewStateTone(row.reviewState)} />
                      <StatusPill label={row.resultStatus} tone={toneForStatus(row.resultStatus)} />
                      <StatusPill label={`${row.finalPercent.toFixed(1)} / 100`} tone="blue" />
                    </div>
                    <p className="text-sm text-[color:var(--app-text)]">{row.candidateRoleLabel || "General assessment"} · {stackSummary(row)}</p>
                    <p className="text-sm text-[color:var(--app-muted)]">Best area: {strongestArea(row)}</p>
                    <p className="text-sm text-[color:var(--app-muted)]">{linkedWorkflowSummary(row)}</p>
                    <Link href={`/results/${row.attemptId}`}>
                      <Button variant="secondary">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
              </StagePanel>
            </StaggerItem>
          ) : null}

          <StaggerItem>
            <StagePanel tone="summary" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Filters</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Search, sort, and narrow the results you want to review.</p>
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
                    pageSize: pageState.pageSize ?? String(page.pageSize)
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

          <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--app-border)] pt-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Export</span>
            <a href={`/api/results/export.csv${query.toString() ? `?${query.toString()}` : ""}`}>
              <Button variant="secondary">Export CSV</Button>
            </a>
            <a href={`/api/results/export.json${query.toString() ? `?${query.toString()}` : ""}`}>
              <Button variant="secondary">Export JSON</Button>
            </a>
          </div>
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
                  <Link href="/results">
                    <Button variant="secondary">Reset filters</Button>
                  </Link>
                </div>
              </StagePanel>
            </StaggerItem>
          ) : (
            <StaggerItem>
              <form id="results-bulk-form" action="/api/results/bulk" method="post" className="space-y-4">
            <input type="hidden" name="returnTo" value={currentPathAndQuery} />
            <StagePanel tone="summary" className="space-y-4">
              <BulkReviewControls formId="results-bulk-form" />
            </StagePanel>

            <StagePanel tone="open" className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-[1040px] w-full table-fixed text-left text-sm">
                  <thead
                    className="border-b text-[color:var(--app-muted)]"
                    style={{
                      borderColor: "var(--app-border)",
                      background: "var(--app-table-head)"
                    }}
                  >
                    <tr>
                      <th className="w-12 px-4 py-3">Select</th>
                      <th className="w-[20%] px-4 py-3">Participant</th>
                      <th className="w-[16%] px-4 py-3">Assessment</th>
                      <th className="w-[11%] px-4 py-3">Score</th>
                      <th className="w-[11%] px-4 py-3">Review</th>
                      <th className="w-[14%] px-4 py-3">Linked record</th>
                      <th className="w-[10%] px-4 py-3">Submitted</th>
                      <th className="w-[12%] px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.rows.map((row) => (
                      <tr
                        key={row.attemptId}
                        className="h-[88px] align-middle transition hover:bg-[color:var(--app-table-row-hover)]"
                        style={{
                          borderBottom: "1px solid var(--app-border)"
                        }}
                      >
                        <td className={resultsTableCellClassName}>
                          <input
                            type="checkbox"
                            name="attemptId"
                            value={row.attemptId}
                            className="h-4 w-4 rounded border-[color:var(--app-border)] bg-transparent text-brand-500"
                          />
                        </td>
                        <td className={resultsTableCellClassName}>
                          <div className="space-y-1">
                            <p className="font-medium text-[color:var(--app-heading)]">{row.candidateName || "Unnamed participant"}</p>
                            <p className="truncate text-[color:var(--app-muted)]" title={row.candidateEmail || "No email"}>
                              {row.candidateEmail || "No email"}
                            </p>
                          </div>
                        </td>
                        <td className={resultsTableCellClassName}>
                          <div className="space-y-1">
                            <p className="text-[color:var(--app-heading)]">{row.candidateRoleLabel || row.coreExamRoleLabel || "General assessment"}</p>
                            <p className="truncate text-xs text-[color:var(--app-muted)]" title={stackSummary(row)}>
                              {stackSummary(row)}
                            </p>
                          </div>
                        </td>
                        <td className={resultsTableCellClassName}>
                          <div className="space-y-1 whitespace-nowrap">
                            <p className="font-medium text-[color:var(--app-heading)]">{row.finalPercent.toFixed(1)} / 100</p>
                            <StatusPill label={row.resultStatus} tone={toneForStatus(row.resultStatus)} />
                          </div>
                        </td>
                        <td className={resultsTableCellClassName}>
                          <div className="whitespace-nowrap">
                            <StatusPill label={reviewStateLabel(row.reviewState)} tone={reviewStateTone(row.reviewState)} />
                          </div>
                        </td>
                        <td className={resultsTableCellClassName}>
                          {row.candidateId ? (
                            <div className="space-y-1">
                              <p className="text-[color:var(--app-text)]">{row.candidateOwner || "Linked profile"}</p>
                              <p className="text-xs text-[color:var(--app-muted)]">
                                {row.candidateStage ? candidateStageLabels[row.candidateStage] : (row.candidateUiStatus ? linkedStatusLabel(row.candidateUiStatus) : "No stage")}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-[color:var(--app-muted)]">None</p>
                          )}
                        </td>
                        <td className={resultsTableCellClassName}>
                          <p
                            className="whitespace-nowrap text-[color:var(--app-text)]"
                            title={new Date(row.submittedAt).toLocaleString()}
                          >
                            {new Date(row.submittedAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className={resultsTableCellClassName}>
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <Link href={`/results/${row.attemptId}`} className={inlineActionClassName}>
                              View
                            </Link>
                            {row.candidateId ? (
                              <>
                                <span className="text-[color:var(--app-muted)]">|</span>
                                <Link href={`/candidates/${row.candidateId}`} className={inlineActionClassName}>
                                  Profile
                                </Link>
                              </>
                            ) : null}
                            <span className="text-[color:var(--app-muted)]">|</span>
                            <Link href={toggleCompare(query, row.attemptId)} className={inlineActionClassName}>
                              {compareIds.includes(row.attemptId) ? "Remove" : "Compare"}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StagePanel>
              </form>
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
