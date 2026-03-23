import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { SavedViewNotice } from "@/components/workspace/SavedViewNotice";
import { CandidateAssessmentPill, CandidateUiStatusPill } from "@/components/candidates/CandidatePills";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { candidateAssessmentStatusLabels, candidateAssessmentStatusValues, candidateUiStatusLabels, candidateUiStatusValues, candidateStageLabels, candidateStageValues, type CandidateAssessmentStatus, type CandidateStage, type CandidateUiStatus } from "@/lib/candidates/types";
import { listCandidateWorkspacePage } from "@/lib/db/candidates";

export const dynamic = "force-dynamic";

type PageState = {
  q?: string;
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
  return `/candidates${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

function bucketLabel(bucket: string) {
  return bucket
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CandidatesPage({
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
  const page = await listCandidateWorkspacePage({
    q: params.q?.trim() || undefined,
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
  const currentPathAndQuery = `/candidates${query.toString() ? `?${query.toString()}` : ""}`;

  return (
    <SceneShell
      variant="results"
      eyebrow="Hiring workspace"
      title="Candidates"
      subtitle="Run the candidate inbox from one place: import, triage, assign, and move people forward."
      utility={
        <div className="flex flex-wrap gap-2">
          <Link href="/candidates/new">
            <Button>Register candidate</Button>
          </Link>
          <Link href={buildHref(query, { sort: "inbox", page: "1" })}>
            <Button variant="secondary">Open inbox</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <SavedViewNotice storageId="candidates" currentPathAndQuery={currentPathAndQuery} />

        {params.deleted ? <div className={messageTone("success")}>Candidate deleted.</div> : null}
        {params.updated ? <div className={messageTone("success")}>Updated {params.updated} candidate(s).</div> : null}
        {params.imported ? (
          <div className={messageTone("success")}>
            Imported {params.imported} candidate(s).
            {params.skipped ? ` Skipped ${params.skipped} duplicate email(s).` : ""}
          </div>
        ) : null}
        {params.error ? <div className={messageTone("error")}>{params.error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StagePanel className="space-y-2 p-4">
            <p className="text-sm text-slate-300">Needs resume</p>
            <p className="text-2xl text-white">{page.summary.needsResume}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-sm text-slate-300">Test not sent</p>
            <p className="text-2xl text-white">{page.summary.testNotSent}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-sm text-slate-300">In progress</p>
            <p className="text-2xl text-white">{page.summary.inProgress}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-sm text-slate-300">Ready for review</p>
            <p className="text-2xl text-white">{page.summary.readyForReview}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-sm text-slate-300">Moved forward</p>
            <p className="text-2xl text-white">{page.summary.movedForward}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-sm text-slate-300">Stalled</p>
            <p className="text-2xl text-white">{page.summary.stalled}</p>
          </StagePanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-white">Filters</h2>
              <p className="text-sm text-slate-300">Everything stays in the URL so your current queue can be restored and shared.</p>
            </div>
            <form className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))_auto_auto]">
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search name, email, owner, notes"
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
              />
              <select
                name="status"
                defaultValue={params.status ?? ""}
                className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
              >
                <option value="">All inbox states</option>
                {candidateUiStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {candidateUiStatusLabels[status]}
                  </option>
                ))}
              </select>
              <select
                name="stage"
                defaultValue={params.stage ?? ""}
                className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
              >
                <option value="">All stages</option>
                {candidateStageValues.map((stage) => (
                  <option key={stage} value={stage}>
                    {candidateStageLabels[stage]}
                  </option>
                ))}
              </select>
              <select
                name="owner"
                defaultValue={params.owner ?? ""}
                className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
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
                className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
              >
                <option value="">All screener states</option>
                {candidateAssessmentStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {candidateAssessmentStatusLabels[status]}
                  </option>
                ))}
              </select>
              <select
                name="sort"
                defaultValue={params.sort ?? "inbox"}
                className="rounded-[18px] border border-white/16 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
              >
                <option value="inbox">Inbox priority</option>
                <option value="updated_desc">Newest activity</option>
                <option value="updated_asc">Oldest activity</option>
                <option value="stale_desc">Most stale</option>
                <option value="name_asc">Name A-Z</option>
              </select>
              <input type="hidden" name="pageSize" value={params.pageSize ?? String(page.pageSize)} />
              <Button>Apply</Button>
              <Link href="/candidates">
                <Button type="button" variant="secondary">
                  Clear
                </Button>
              </Link>
            </form>

            <div className="flex flex-wrap gap-2">
              <Link href={buildHref(query, { status: "need_review", sort: "inbox", page: "1" })}>
                <Button variant="ghost">Review queue</Button>
              </Link>
              <Link href={buildHref(query, { assessmentStatus: "none", sort: "inbox", page: "1" })}>
                <Button variant="ghost">Needs screener</Button>
              </Link>
              <Link href={buildHref(query, { sort: "stale_desc", page: "1" })}>
                <Button variant="ghost">Most stale</Button>
              </Link>
            </div>
          </StagePanel>

          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-white">Import CSV</h2>
              <p className="text-sm text-slate-300">Use headers like `fullName,email,positionAppliedFor,hrOwner`.</p>
            </div>
            <form action="/api/candidates/bulk" method="post" encType="multipart/form-data" className="space-y-3">
              <input type="hidden" name="action" value="import_csv" />
              <input type="hidden" name="returnTo" value={currentPathAndQuery} />
              <input
                type="file"
                name="csvFile"
                accept=".csv,text/csv"
                className="w-full rounded-[18px] border border-dashed border-white/16 bg-white/[0.05] px-4 py-6 text-sm text-slate-200"
              />
              <Button type="submit">Import candidates</Button>
            </form>
          </StagePanel>
        </div>

        {page.rows.length === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-white">No candidates match this view</h2>
            <p className="text-sm text-slate-300">Try clearing a filter, importing candidates, or registering a new candidate.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/candidates/new">
                <Button>Register candidate</Button>
              </Link>
              <Link href="/candidates">
                <Button variant="secondary">Reset filters</Button>
              </Link>
            </div>
          </StagePanel>
        ) : (
          <form action="/api/candidates/bulk" method="post" className="space-y-4">
            <input type="hidden" name="returnTo" value={currentPathAndQuery} />
            <StagePanel className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-2xl text-white">Candidate inbox</h2>
                  <p className="text-sm text-slate-300">Select one or more rows to assign, update status, or add a reviewer note in bulk.</p>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <select
                    name="action"
                    defaultValue="assign_owner"
                    className="rounded-[16px] border border-white/16 bg-ink-950 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="assign_owner">Assign owner</option>
                    <option value="set_ui_status">Set inbox state</option>
                    <option value="add_note">Add note</option>
                  </select>
                  <input
                    name="owner"
                    placeholder="Owner"
                    className="rounded-[16px] border border-white/16 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none"
                  />
                  <select
                    name="status"
                    defaultValue="need_review"
                    className="rounded-[16px] border border-white/16 bg-ink-950 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {candidateUiStatusValues.map((status) => (
                      <option key={status} value={status}>
                        {candidateUiStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <Button type="submit">Apply to selected</Button>
                </div>
              </div>
              <textarea
                name="noteBody"
                rows={2}
                placeholder="Optional reviewer note used when action = Add note"
                className="w-full rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
              />
            </StagePanel>

            <div className="space-y-3">
              {page.rows.map((candidate) => (
                <StagePanel key={candidate.id} className="p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex gap-4">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          name="candidateId"
                          value={candidate.id}
                          className="h-4 w-4 rounded border-white/20 bg-transparent text-brand-400"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <CandidateUiStatusPill status={candidate.uiStatus} />
                          <CandidateAssessmentPill status={candidate.latestAssessmentStatus} />
                          <StatusPill label={bucketLabel(candidate.openWorkBucket)} tone={candidate.openWorkBucket === "ready_for_review" ? "amber" : candidate.openWorkBucket === "stalled" ? "red" : candidate.openWorkBucket === "moved_forward" ? "emerald" : "neutral"} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg text-white">{candidate.fullName}</p>
                          <p className="text-sm text-slate-300">
                            {candidate.positionAppliedFor || "Role not set"}{candidate.hrOwner ? ` | Owner: ${candidate.hrOwner}` : " | No owner"}
                          </p>
                          <p className="text-sm text-slate-400">
                            {candidate.currentFocus || "No current focus"} | Last activity {candidate.staleDays} day(s) ago
                          </p>
                          {candidate.notesSummary ? <p className="text-sm text-brand-100">{candidate.notesSummary}</p> : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:min-w-[320px]">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Latest screener</p>
                          <p className="mt-1 text-sm text-white">
                            {candidate.latestAssessment?.finalPercent?.toFixed(1)
                              ? `${candidate.latestAssessment.finalPercent.toFixed(1)} / 100`
                              : candidateAssessmentStatusLabels[candidate.latestAssessmentStatus]}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Stage</p>
                          <p className="mt-1 text-sm text-white">{candidateStageLabels[candidate.stage]}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <Link href={`/candidates/${candidate.id}`}>
                          <Button variant="secondary">Open</Button>
                        </Link>
                        {candidate.latestAssessment?.attemptId ? (
                          <Link href={`/results/${candidate.latestAssessment.attemptId}`}>
                            <Button variant="secondary">View result</Button>
                          </Link>
                        ) : null}
                        {candidate.latestAssessmentStatus === "none" ? (
                          <Link href={`/create-test?candidateId=${candidate.id}`}>
                            <Button>Send screener</Button>
                          </Link>
                        ) : null}
                        <Link href={`/candidates/${candidate.id}`}>
                          <Button variant="secondary">Manage</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </StagePanel>
              ))}
            </div>
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
