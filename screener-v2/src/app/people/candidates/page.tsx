import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { PersistedTableState } from "@/components/workspace/PersistedTableState";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { InlineStatusSelect } from "@/components/candidates/InlineStatusSelect";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { requirePageSession } from "@/lib/auth/guards";
import {
  candidateAssessmentStatusLabels,
  candidateAssessmentStatusValues,
  candidateUiStatusLabels,
  candidateUiStatusValues,
  candidateStageLabels,
  candidateStageValues,
  type CandidateAssessmentStatus,
  type CandidateStage,
  type CandidateUiStatus
} from "@/lib/candidates/types";
import { listCandidateWorkspacePage } from "@/lib/db/candidates";

export const dynamic = "force-dynamic";

type PageState = {
  q?: string;
  roleId?: string;
  status?: string;
  stage?: string;
  owner?: string;
  assessmentStatus?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
  deleted?: string;
  error?: string;
  updated?: string;
  imported?: string;
  skipped?: string;
};

function messageTone(type: "success" | "error") {
  return type === "success"
    ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
    : "rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100";
}

function buildHref(params: URLSearchParams, overrides: Record<string, string | undefined>): Route {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  return `/people/candidates${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

function bucketLabel(bucket: string) {
  return bucket
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function filterFieldClassName() {
  return "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";
}

const tableShellClassName =
  "overflow-hidden rounded-[24px] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)]";

const tableHeadClassName =
  "bg-[color:var(--app-surface-soft)] text-left text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]";

const tableCellClassName =
  "px-4 py-4 text-sm text-[color:var(--app-text)] align-middle border-t border-[color:var(--app-border)]";

const inlineActionClassName =
  "text-sm font-medium text-[color:var(--app-brand-strong)] transition hover:text-[color:var(--app-brand)]";

function contextualAction(candidate: Awaited<ReturnType<typeof listCandidateWorkspacePage>>["rows"][number]) {
  if (candidate.latestAssessment?.attemptId) {
    return {
      href: `/results/${candidate.latestAssessment.attemptId}` as Route,
      label: "Result"
    };
  }

  if (candidate.latestAssessmentStatus === "none") {
    return {
      href: `/create-test?candidateId=${candidate.id}` as Route,
      label: "Send"
    };
  }

  return null;
}

export default async function PeopleCandidatesPage({
  searchParams
}: {
  searchParams: Promise<PageState>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, value as string])
  );
  const nextPath = `/people/candidates${query.toString() ? `?${query.toString()}` : ""}`;
  await requirePageSession(nextPath);
  const page = await listCandidateWorkspacePage({
    q: params.q?.trim() || undefined,
    roleId: params.roleId?.trim() || undefined,
    status: candidateUiStatusValues.includes(params.status as CandidateUiStatus)
      ? (params.status as CandidateUiStatus)
      : undefined,
    stage: candidateStageValues.includes(params.stage as CandidateStage)
      ? (params.stage as CandidateStage)
      : undefined,
    owner: params.owner?.trim() || undefined,
    assessmentStatus: candidateAssessmentStatusValues.includes(params.assessmentStatus as CandidateAssessmentStatus)
      ? (params.assessmentStatus as CandidateAssessmentStatus)
      : undefined,
    sort: (params.sort as "updated_desc" | "updated_asc" | "name_asc" | "stale_desc" | "inbox") || "inbox",
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 12)
  });
  const currentPathAndQuery = nextPath;

  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="People"
        title="Candidates"
        subtitle="Search and manage candidates."
        utility={
          <div className="flex flex-wrap items-center gap-2">
            <PeopleViewSwitch current="candidates" />
            <Link href="/candidates/new">
              <Button>Add candidate</Button>
            </Link>
          </div>
        }
      >
        <PersistedTableState storageKey="people-candidates-table-view" />
        <StaggerGroup className="space-y-5" delay={0.04}>
          {params.deleted ? <StaggerItem><div className={messageTone("success")}>Candidate deleted.</div></StaggerItem> : null}
          {params.updated ? <StaggerItem><div className={messageTone("success")}>Updated {params.updated} candidate(s).</div></StaggerItem> : null}
          {params.imported ? (
            <StaggerItem>
              <div className={messageTone("success")}>
                Imported {params.imported} candidate(s).
                {params.skipped ? ` Skipped ${params.skipped} duplicate email(s).` : ""}
              </div>
            </StaggerItem>
          ) : null}
          {params.error ? <StaggerItem><div className={messageTone("error")}>{params.error}</div></StaggerItem> : null}

          <StaggerItem>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`${page.total} total`} tone="neutral" />
                  <StatusPill label={`${page.summary.readyForReview} ready`} tone="amber" />
                  <StatusPill label={`${page.summary.stalled} stalled`} tone={page.summary.stalled > 0 ? "red" : "neutral"} />
                </div>
              </div>

              <form className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,0.9fr))_auto_auto]">
                <input type="hidden" name="pageSize" value={params.pageSize ?? String(page.pageSize)} />
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search name, email, or owner"
                  className={filterFieldClassName()}
                />
                <select
                  name="roleId"
                  defaultValue={params.roleId ?? ""}
                  className={filterFieldClassName()}
                >
                  <option value="">All roles</option>
                  {page.roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  defaultValue={params.status ?? ""}
                  className={filterFieldClassName()}
                >
                  <option value="">All statuses</option>
                  {candidateUiStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {candidateUiStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <select
                  name="owner"
                  defaultValue={params.owner ?? ""}
                  className={filterFieldClassName()}
                >
                  <option value="">All owners</option>
                  {page.ownerOptions.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
                <select
                  name="assessmentStatus"
                  defaultValue={params.assessmentStatus ?? ""}
                  className={filterFieldClassName()}
                >
                  <option value="">Assessment</option>
                  {candidateAssessmentStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {candidateAssessmentStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <select
                  name="sort"
                  defaultValue={params.sort ?? "inbox"}
                  className={filterFieldClassName()}
                >
                  <option value="inbox">Sort</option>
                  <option value="updated_desc">Newest activity</option>
                  <option value="updated_asc">Oldest activity</option>
                  <option value="stale_desc">Most stale</option>
                  <option value="name_asc">Name A-Z</option>
                </select>
                <Button>Apply</Button>
                <Link href="/people/candidates?clearView=1">
                  <Button type="button" variant="secondary">
                    Reset
                  </Button>
                </Link>
              </form>

              <div className="flex flex-wrap gap-2">
                <Link href={buildHref(query, { status: "need_review", sort: "inbox", page: "1" })}>
                  <Button variant="ghost">Review needed</Button>
                </Link>
                <Link href={buildHref(query, { assessmentStatus: "none", sort: "inbox", page: "1" })}>
                  <Button variant="ghost">Needs assessment</Button>
                </Link>
                <Link href={buildHref(query, { sort: "stale_desc", page: "1" })}>
                  <Button variant="ghost">Most stale</Button>
                </Link>
              </div>

              <div className="rounded-[20px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--app-heading)]">Import from CSV</p>
                    <p className="text-sm text-[color:var(--app-muted)]">Use: `fullName,email,role,hrOwner`.</p>
                  </div>
                  <form action="/api/candidates/bulk" method="post" encType="multipart/form-data" className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <input type="hidden" name="action" value="import_csv" />
                    <input type="hidden" name="returnTo" value={currentPathAndQuery} />
                    <input
                      type="file"
                      name="csvFile"
                      accept=".csv,text/csv"
                      className="w-full rounded-[16px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-text)] lg:min-w-[320px]"
                    />
                    <Button type="submit">Import CSV</Button>
                  </form>
                </div>
              </div>
            </div>
          </StaggerItem>

          {page.rows.length === 0 ? (
            <StaggerItem>
              <StagePanel className="space-y-3">
                <h2 className="text-2xl text-[color:var(--app-heading)]">No candidates match this view</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Try clearing a filter, importing candidates, or adding a candidate.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/candidates/new">
                    <Button>Add candidate</Button>
                  </Link>
                <Link href="/people/candidates?clearView=1">
                  <Button variant="secondary">Reset filters</Button>
                </Link>
                </div>
              </StagePanel>
            </StaggerItem>
          ) : (
            <StaggerItem>
              <form action="/api/candidates/bulk" method="post" className="space-y-4">
                <input type="hidden" name="returnTo" value={currentPathAndQuery} />
                <details className="rounded-[20px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <div className="space-y-1">
                    <h2 className="text-lg text-[color:var(--app-heading)]">Bulk actions</h2>
                      <p className="text-sm text-[color:var(--app-muted)]">Update several candidates at once.</p>
                    </div>
                    <StatusPill label="Optional" tone="neutral" />
                  </summary>
                  <div className="mt-4 grid gap-3 border-t border-[color:var(--app-border)] pt-4 xl:grid-cols-4">
                      <select
                        name="action"
                        defaultValue="assign_owner"
                        className={filterFieldClassName()}
                      >
                        <option value="assign_owner">Assign owner</option>
                        <option value="set_ui_status">Change status</option>
                        <option value="add_note">Add note</option>
                      </select>
                      <input
                        name="owner"
                        placeholder="Owner"
                        className={filterFieldClassName()}
                      />
                      <select
                        name="status"
                        defaultValue="need_review"
                        className={filterFieldClassName()}
                      >
                        {candidateUiStatusValues.map((status) => (
                          <option key={status} value={status}>
                            {candidateUiStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                      <Button type="submit">Apply</Button>
                  </div>
                  <textarea
                    name="noteBody"
                    rows={2}
                    placeholder="Optional note"
                    className="mt-3 w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50"
                  />
                </details>

                <div className={tableShellClassName}>
                  <div className="overflow-x-auto">
                    <table className="min-w-[1120px] w-full table-fixed text-left">
                      <thead className={tableHeadClassName}>
                        <tr>
                          <th className="w-12 px-4 py-3 font-medium">Select</th>
                          <th className="w-[18%] px-4 py-3 font-medium">Name</th>
                          <th className="w-[12%] px-4 py-3 font-medium">Role</th>
                          <th className="w-[11%] px-4 py-3 font-medium">Owner</th>
                          <th className="w-[17%] px-4 py-3 font-medium">Status</th>
                          <th className="w-[10%] px-4 py-3 font-medium">Stage</th>
                          <th className="w-[15%] px-4 py-3 font-medium">Latest assessment</th>
                          <th className="w-[9%] px-4 py-3 font-medium">Updated</th>
                          <th className="w-[16%] px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.rows.map((candidate) => (
                          <tr key={candidate.id} className="h-[88px] transition hover:bg-[color:var(--app-surface-soft)]/70">
                            <td className={tableCellClassName}>
                              <input
                                type="checkbox"
                                name="candidateId"
                                value={candidate.id}
                                className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-transparent text-brand-400"
                              />
                            </td>
                            <td className={tableCellClassName}>
                              <div>
                                <p className="font-medium text-[color:var(--app-heading)]">{candidate.fullName}</p>
                                <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">
                                  {bucketLabel(candidate.openWorkBucket)}
                                </p>
                              </div>
                            </td>
                            <td className={tableCellClassName}>
                              <span>{candidate.roleLabel || "Not set"}</span>
                            </td>
                            <td className={tableCellClassName}>
                              <span>{candidate.hrOwner || "Unassigned"}</span>
                            </td>
                            <td className={tableCellClassName}>
                              <div className="min-w-[150px]">
                                <InlineStatusSelect
                                  candidateId={candidate.id}
                                  currentStatus={candidate.uiStatus}
                                  returnTo={currentPathAndQuery}
                                />
                              </div>
                            </td>
                            <td className={tableCellClassName}>
                              <span>{candidate.currentFocus || candidateStageLabels[candidate.stage]}</span>
                            </td>
                            <td className={tableCellClassName}>
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <CandidateAssessmentPill status={candidate.latestAssessmentStatus} />
                                <span className="text-xs text-[color:var(--app-muted)]">
                                  {typeof candidate.latestAssessment?.finalPercent === "number"
                                    ? `${candidate.latestAssessment.finalPercent.toFixed(1)} / 100`
                                    : candidateAssessmentStatusLabels[candidate.latestAssessmentStatus]}
                                </span>
                              </div>
                            </td>
                            <td className={tableCellClassName}>
                              <span>{candidate.staleDays === 0 ? "Today" : `${candidate.staleDays}d ago`}</span>
                            </td>
                            <td className={tableCellClassName}>
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                {(() => {
                                  const action = contextualAction(candidate);
                                  return action ? (
                                    <Link href={action.href} className={inlineActionClassName}>
                                      {action.label}
                                    </Link>
                                  ) : null;
                                })()}
                                {candidate.hasResume && candidate.latestResumeStorageKey ? (
                                  <>
                                    {contextualAction(candidate) ? <span className="text-[color:var(--app-muted)]">|</span> : null}
                                    <a
                                      href={`/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(candidate.latestResumeStorageKey)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={inlineActionClassName}
                                    >
                                      CV
                                    </a>
                                  </>
                                ) : null}
                                {(contextualAction(candidate) || (candidate.hasResume && candidate.latestResumeStorageKey))
                                  ? <span className="text-[color:var(--app-muted)]">|</span>
                                  : null}
                                <Link href={`/candidates/${candidate.id}`} className={inlineActionClassName}>
                                  View profile
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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
