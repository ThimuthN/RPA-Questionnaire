import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { PersistedTableState } from "@/components/workspace/PersistedTableState";
import { CandidateWorkspaceTable } from "@/components/candidates/CandidateWorkspaceTable";
import { CandidateCsvImportModal } from "@/components/candidates/CandidateCsvImportModal";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
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

const transientBannerKeys = ["deleted", "error", "updated", "imported", "skipped"] as const;

function messageTone(type: "success" | "error") {
  return type === "success"
    ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
    : "rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100";
}

function NoticeBanner({
  tone,
  children
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return <div className={messageTone(tone)}>{children}</div>;
}

function buildHref(params: URLSearchParams, overrides: Record<string, string | undefined>): Route {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  return `/people/candidates${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

function filterFieldClassName() {
  return "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";
}

export default async function PeopleCandidatesPage({
  searchParams
}: {
  searchParams: Promise<PageState>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(
        ([key, value]) =>
          typeof value === "string" &&
          value.length > 0 &&
          !transientBannerKeys.includes(key as (typeof transientBannerKeys)[number])
      )
      .map(([key, value]) => [key, value as string])
  );
  const nextPath = `/people/candidates${query.toString() ? `?${query.toString()}` : ""}`;
  await requirePageSession(nextPath);
  const page = await listCandidateWorkspacePage({
    intakeBucket: "pipeline",
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
            <CandidateCsvImportModal returnTo={currentPathAndQuery} />
            <Link href="/candidates/new">
              <Button>Add candidate</Button>
            </Link>
          </div>
        }
      >
        <PersistedTableState
          storageKey="people-candidates-table-view"
          transientKeys={[...transientBannerKeys]}
        />
        <StaggerGroup className="space-y-5" delay={0.04}>
          <StaggerItem>
            <CandidatesViewSwitch current="pipeline" />
          </StaggerItem>
          {params.deleted ? <StaggerItem><NoticeBanner tone="success">Candidate deleted.</NoticeBanner></StaggerItem> : null}
          {params.updated ? <StaggerItem><NoticeBanner tone="success">Updated {params.updated} candidate(s).</NoticeBanner></StaggerItem> : null}
          {params.imported ? (
            <StaggerItem>
              <NoticeBanner tone="success">
                Imported {params.imported} candidate(s).
                {params.skipped ? ` Skipped ${params.skipped} duplicate email(s).` : ""}
              </NoticeBanner>
            </StaggerItem>
          ) : null}
          {params.error ? <StaggerItem><NoticeBanner tone="error">{params.error}</NoticeBanner></StaggerItem> : null}

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
              <CandidateWorkspaceTable
                rows={page.rows}
                currentPathAndQuery={currentPathAndQuery}
                roleOptions={page.roleOptions}
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
