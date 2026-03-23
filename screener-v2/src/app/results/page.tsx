import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/primitives/Button";
import { BulkReviewControls } from "@/components/results/BulkReviewControls";
import { StatusPill } from "@/components/primitives/StatusPill";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { SavedViewNotice } from "@/components/workspace/SavedViewNotice";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { candidateAssessmentStatusLabels, candidateAssessmentStatusValues, candidateStageLabels, candidateStageValues, candidateUiStatusLabels, type CandidateAssessmentStatus, type CandidateStage, type CandidateUiStatus } from "@/lib/candidates/types";
import { listResultWorkspacePage } from "@/lib/db/repositories";
import type { IntegrityRiskLevel, ResultStatusFilter } from "@/lib/results/triage";
import type { ResultListSort, ResultScoreBand, WorkspaceResultRow } from "@/lib/results/workspace";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusOptions: ResultStatusFilter[] = ["pass", "review", "fail"];
const integrityOptions: IntegrityRiskLevel[] = ["clean", "watch", "review"];
const roleOptions = ["Intern", "Associate", "SE", "SeniorSE", "TechLead"] as const;
const scoreBandOptions: ResultScoreBand[] = ["high", "mid", "low"];

type PageState = {
  deleted?: string;
  error?: string;
  updated?: string;
  q?: string;
  status?: string;
  integrity?: string;
  role?: string;
  owner?: string;
  stage?: string;
  assessmentStatus?: string;
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

function strongestArea(row: WorkspaceResultRow) {
  return Object.entries(row.breakdownByCategory).sort((left, right) => right[1].percent - left[1].percent)[0]?.[0] ?? "No data";
}

const filterControlClass =
  "w-full rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60";

const filterInputClass =
  "w-full rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60";

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
      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </label>
  );
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
  const page = await listResultWorkspacePage({
    q: pageState.q?.trim() || undefined,
    status: statusOptions.includes(pageState.status as ResultStatusFilter)
      ? (pageState.status as ResultStatusFilter)
      : undefined,
    integrity: integrityOptions.includes(pageState.integrity as IntegrityRiskLevel)
      ? (pageState.integrity as IntegrityRiskLevel)
      : undefined,
    role: roleOptions.includes(pageState.role as (typeof roleOptions)[number])
      ? (pageState.role as (typeof roleOptions)[number])
      : undefined,
    owner: pageState.owner?.trim() || undefined,
    stage: candidateStageValues.includes(pageState.stage as CandidateStage)
      ? (pageState.stage as CandidateStage)
      : undefined,
    assessmentStatus: candidateAssessmentStatusValues.includes(pageState.assessmentStatus as CandidateAssessmentStatus)
      ? (pageState.assessmentStatus as CandidateAssessmentStatus)
      : undefined,
    scoreBand: scoreBandOptions.includes(pageState.scoreBand as ResultScoreBand)
      ? (pageState.scoreBand as ResultScoreBand)
      : undefined,
    sort: (pageState.sort as ResultListSort) || "newest",
    page: Number(pageState.page ?? 1),
    pageSize: Number(pageState.pageSize ?? 12)
  });
  const currentPathAndQuery = `/results${query.toString() ? `?${query.toString()}` : ""}`;
  const compareIds = compareIdsFromRaw(pageState.compare);
  const comparison =
    compareIds.length > 0
      ? await listResultWorkspacePage({
          attemptIds: compareIds,
          page: 1,
          pageSize: compareIds.length
        })
      : null;

  return (
    <SceneShell
      variant="results"
      eyebrow="Decision queue"
      title="Results"
      subtitle="Review scores with candidate context, compare shortlists, and move people forward without leaving the queue."
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`Pass ${page.statusCounts.pass}`} tone="emerald" />
          <StatusPill label={`Review ${page.statusCounts.review}`} tone="amber" />
          <StatusPill label={`Fail ${page.statusCounts.fail}`} tone="red" />
        </div>
      }
    >
      <div className="space-y-5">
        <SavedViewNotice storageId="results" currentPathAndQuery={currentPathAndQuery} />

        {pageState.deleted ? (
          <div className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Result deleted.
          </div>
        ) : null}
        {pageState.updated ? (
          <div className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Updated {pageState.updated} result-linked candidate(s).
          </div>
        ) : null}
        {pageState.error ? (
          <div className="rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {pageState.error}
          </div>
        ) : null}

        {comparison && comparison.rows.length > 0 ? (
          <StagePanel className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Compare shortlist</h2>
                <p className="text-sm text-slate-300">Compare up to four results side by side. Use the compare link in any row to add or remove candidates.</p>
              </div>
              <Link href={buildHref(query, { compare: undefined })}>
                <Button variant="secondary">Clear compare</Button>
              </Link>
            </div>
            <div className="grid gap-4 xl:grid-cols-4">
              {comparison.rows.map((row) => (
                <div key={row.attemptId} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="space-y-2">
                    <p className="text-lg text-white">{row.candidateName || "Unnamed candidate"}</p>
                    <p className="text-sm text-slate-300">{row.candidateOwner || "No owner"}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={row.resultStatus} tone={toneForStatus(row.resultStatus)} />
                      <StatusPill label={`${row.finalPercent.toFixed(1)} / 100`} tone="blue" />
                    </div>
                    <p className="text-sm text-slate-300">Strongest area: {strongestArea(row)}</p>
                    <p className="text-sm text-slate-400">
                      {row.candidateStage ? candidateStageLabels[row.candidateStage] : "No stage"}{row.candidateOwner ? ` | ${row.candidateOwner}` : ""}
                    </p>
                    <Link href={`/results/${row.attemptId}`}>
                      <Button variant="secondary">Open result</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </StagePanel>
        ) : null}

        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Filters</h2>
            <p className="text-sm text-slate-300">Filter by review context, not just score. Exports follow the current view.</p>
          </div>
          <form className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
              <FilterField label="Search">
                <input
                  name="q"
                  defaultValue={pageState.q ?? ""}
                  placeholder="Candidate, email, owner, or notes"
                  className={filterInputClass}
                />
              </FilterField>
              <FilterField label="Sort by">
                <select name="sort" defaultValue={pageState.sort ?? "newest"} className={filterControlClass}>
                  <option value="newest">Newest</option>
                  <option value="score_desc">Score high to low</option>
                  <option value="score_asc">Score low to high</option>
                  <option value="risk_desc">Integrity risk</option>
                  <option value="stale_desc">Most stale candidate</option>
                </select>
              </FilterField>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Outcome">
                <select name="status" defaultValue={pageState.status ?? ""} className={filterControlClass}>
                  <option value="">All outcomes</option>
                  <option value="pass">Pass</option>
                  <option value="review">Review</option>
                  <option value="fail">Fail</option>
                </select>
              </FilterField>
              <FilterField label="Integrity">
                <select name="integrity" defaultValue={pageState.integrity ?? ""} className={filterControlClass}>
                  <option value="">All integrity levels</option>
                  <option value="clean">Clean</option>
                  <option value="watch">Watch</option>
                  <option value="review">Review</option>
                </select>
              </FilterField>
              <FilterField label="Role">
                <select name="role" defaultValue={pageState.role ?? ""} className={filterControlClass}>
                  <option value="">All roles</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Owner">
                <select name="owner" defaultValue={pageState.owner ?? ""} className={filterControlClass}>
                  <option value="">All owners</option>
                  {page.ownerOptions.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Candidate stage">
                <select name="stage" defaultValue={pageState.stage ?? ""} className={filterControlClass}>
                  <option value="">All stages</option>
                  {candidateStageValues.map((stage) => (
                    <option key={stage} value={stage}>
                      {candidateStageLabels[stage]}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Screener state">
                <select
                  name="assessmentStatus"
                  defaultValue={pageState.assessmentStatus ?? ""}
                  className={filterControlClass}
                >
                  <option value="">All screener states</option>
                  {candidateAssessmentStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {candidateAssessmentStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Score band">
                <select name="scoreBand" defaultValue={pageState.scoreBand ?? ""} className={filterControlClass}>
                  <option value="">All score bands</option>
                  <option value="high">High</option>
                  <option value="mid">Mid</option>
                  <option value="low">Low</option>
                </select>
              </FilterField>
              <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Quick view</p>
                <p className="mt-2">
                  Use filters to focus the queue. Exports include only the results visible in this view.
                </p>
              </div>
            </div>
            <input type="hidden" name="pageSize" value={pageState.pageSize ?? String(page.pageSize)} />
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-1">
              <Button>Apply filters</Button>
              <Link href="/results">
                <Button type="button" variant="secondary">Clear filters</Button>
              </Link>
              <Link href={buildHref(query, { status: "review", sort: "newest", page: "1" })}>
                <Button type="button" variant="ghost">Open review queue</Button>
              </Link>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Export current view</span>
            <a href={`/api/results/export.csv${query.toString() ? `?${query.toString()}` : ""}`}>
              <Button variant="secondary">Export CSV</Button>
            </a>
            <a href={`/api/results/export.json${query.toString() ? `?${query.toString()}` : ""}`}>
              <Button variant="secondary">Export JSON</Button>
            </a>
          </div>
        </StagePanel>

        {page.rows.length === 0 ? (
          <StagePanel className="space-y-4">
            <h2 className="text-2xl text-white">No results match this view</h2>
            <p className="text-slate-200">Try clearing a filter or running a new assessment.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/assessments">
                <Button>Open assessments</Button>
              </Link>
              <Link href="/results">
                <Button variant="secondary">Reset filters</Button>
              </Link>
            </div>
          </StagePanel>
        ) : (
          <form id="results-bulk-form" action="/api/results/bulk" method="post" className="space-y-4">
            <input type="hidden" name="returnTo" value={currentPathAndQuery} />
            <StagePanel className="space-y-4">
              <BulkReviewControls formId="results-bulk-form" />
            </StagePanel>

            <StagePanel className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.04] text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Result</th>
                      <th className="px-4 py-3">Context</th>
                      <th className="px-4 py-3">Activity</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.rows.map((row) => (
                      <tr key={row.attemptId} className="border-b border-white/10 align-top">
                        <td className="px-4 py-4">
                          <input type="checkbox" name="attemptId" value={row.attemptId} className="h-4 w-4 rounded border-white/20 bg-transparent text-brand-400" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-white">{row.candidateName || "Unnamed candidate"}</p>
                            <p className="text-slate-300">{row.candidateEmail || "No email captured"}</p>
                            <p className="text-xs text-slate-400">{row.candidateOwner || "No owner"}{row.candidateStage ? ` | ${candidateStageLabels[row.candidateStage]}` : ""}</p>
                            {row.candidateNotesSummary ? <p className="text-xs text-brand-100">{row.candidateNotesSummary}</p> : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <StatusPill label={row.resultStatus} tone={toneForStatus(row.resultStatus)} />
                              <StatusPill label={`Integrity ${row.integrityRisk}`} tone={toneForIntegrity(row.integrityRisk)} />
                            </div>
                            <p className="text-white">{row.finalPercent.toFixed(1)} / 100</p>
                            <p className="text-xs text-slate-400">Strongest area: {strongestArea(row)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            {row.candidateUiStatus ? (
                              <StatusPill label={candidateUiStatusLabels[row.candidateUiStatus]} tone={row.candidateUiStatus === "moved_forward" ? "emerald" : row.candidateUiStatus === "need_review" ? "amber" : row.candidateUiStatus === "rejected" ? "red" : "blue"} />
                            ) : null}
                            <p className="text-slate-300">{row.roleId}</p>
                            <p className="text-xs text-slate-400">
                              {row.candidateAssessmentStatus ? candidateAssessmentStatusLabels[row.candidateAssessmentStatus] : "Result ready"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="text-slate-200">{row.candidateStaleDays ?? 0} day(s) stale</p>
                            <p className="text-xs text-slate-400">{new Date(row.submittedAt).toLocaleString()}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/results/${row.attemptId}`}>
                              <Button variant="secondary">Open result</Button>
                            </Link>
                            {row.candidateId ? (
                              <Link href={`/candidates/${row.candidateId}`}>
                                <Button variant="secondary">Open candidate</Button>
                              </Link>
                            ) : null}
                            <Link href={toggleCompare(query, row.attemptId)}>
                              <Button variant="ghost">{compareIds.includes(row.attemptId) ? "Remove compare" : "Compare"}</Button>
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
        )}

        <PaginationBar
          page={page.page}
          pageSize={page.pageSize}
          total={page.total}
          makeHref={(nextPage) => buildHref(query, { page: String(nextPage) })}
        />
      </div>
    </SceneShell>
  );
}
