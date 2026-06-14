import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { PersistedTableState } from "@/components/workspace/PersistedTableState";
import { CandidateWorkspaceTable } from "@/components/candidates/CandidateWorkspaceTable";
import { CandidateCsvImportModal } from "@/components/candidates/CandidateCsvImportModal";
import { CandidatesViewSwitch, type CandidatesView } from "@/components/candidates/CandidatesViewSwitch";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import {
  candidateAssessmentStatusLabels,
  candidateAssessmentStatusValues,
  candidateStageValues,
  type CandidateAssessmentStatus,
  type CandidateStage
} from "@/lib/candidates/types";
import { listCandidateWorkspacePage } from "@/lib/db/candidates";
import { listDepartments } from "@/lib/db/departments";
import { type RouteSearchParams, readSearchParam, toSearchParamEntries } from "@/lib/http/search-params";

type CandidateWorkspacePageState = {
  q?: string;
  roleId?: string;
  departmentId?: string;
  stage?: string;
  owner?: string;
  assessmentStatus?: string;
  finalizedAs?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
  deleted?: string;
  error?: string;
  updated?: string;
  imported?: string;
  skipped?: string;
  clearView?: string;
};

const transientBannerKeys = ["deleted", "error", "updated", "imported", "skipped", "clearView"] as const;

function filterFieldClassName() {
  return "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";
}

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

function basePathForScope(scope: "global" | "department", departmentId?: string) {
  return scope === "department" && departmentId
    ? (`/departments/${departmentId}/candidates` as Route)
    : ("/people/candidates" as Route);
}

function buildHref(
  basePath: Route,
  params: URLSearchParams,
  overrides: Record<string, string | undefined>
) {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  return `${basePath}${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

function currentCandidatesView(stage?: string): CandidatesView {
  if (stage === "applicant") return "applicants";
  if (stage === "screening") return "screener";
  if (stage === "interview") return "interview";
  if (stage === "advanced_review") return "advanced_review";
  if (stage === "finalized") return "finalized";
  return "pipeline";
}

function normalizeSearchParams(searchParams: RouteSearchParams): CandidateWorkspacePageState {
  return {
    q: readSearchParam(searchParams, "q"),
    roleId: readSearchParam(searchParams, "roleId"),
    departmentId: readSearchParam(searchParams, "departmentId"),
    stage: readSearchParam(searchParams, "stage"),
    owner: readSearchParam(searchParams, "owner"),
    assessmentStatus: readSearchParam(searchParams, "assessmentStatus"),
    finalizedAs: readSearchParam(searchParams, "finalizedAs"),
    sort: readSearchParam(searchParams, "sort"),
    page: readSearchParam(searchParams, "page"),
    pageSize: readSearchParam(searchParams, "pageSize"),
    deleted: readSearchParam(searchParams, "deleted"),
    error: readSearchParam(searchParams, "error"),
    updated: readSearchParam(searchParams, "updated"),
    imported: readSearchParam(searchParams, "imported"),
    skipped: readSearchParam(searchParams, "skipped"),
    clearView: readSearchParam(searchParams, "clearView")
  };
}

export type CandidateWorkspaceViewProps = {
  scope: "global" | "department";
  departmentId?: string;
  departmentName?: string;
  searchParams: Record<string, string | string[] | undefined>;
};

export async function CandidateWorkspaceView({
  scope,
  departmentId,
  searchParams
}: CandidateWorkspaceViewProps) {
  const params = normalizeSearchParams(searchParams);
  const basePath = basePathForScope(scope, departmentId);
  const query = new URLSearchParams(
    toSearchParamEntries(searchParams, { omitKeys: [...transientBannerKeys] })
  );
  const nextPath = `${basePath}${query.toString() ? `?${query.toString()}` : ""}`;
  const session = await requirePageSession(nextPath);

  if (scope === "global") {
    if (!session.permissions.includes("view_candidates")) {
      redirect("/people");
    }
  } else {
    const permission = await requirePermissionForDepartment(session, "view_candidates", departmentId);
    if (!permission.ok) {
      notFound();
    }
  }

  const canManageCandidates = session.permissions.includes("manage_candidates");
  const isGlobalViewCandidates =
    scope === "global" && session.userId
      ? await hasGlobalPermission(session.userId, "view_candidates")
      : false;
  const effectiveDepartmentId =
    scope === "department"
      ? departmentId
      : isGlobalViewCandidates
        ? params.departmentId?.trim() || undefined
        : session.departmentId ?? undefined;

  const isFinalizedView = params.stage === "finalized";
  const selectedStage =
    !isFinalizedView && candidateStageValues.includes(params.stage as CandidateStage)
      ? (params.stage as CandidateStage)
      : "pipeline";
  const selectedStageValues = !isFinalizedView && selectedStage === "pipeline" ? ["pipeline", "new"] : undefined;
  const shouldLoadDepartments = canManageCandidates || (scope === "global" && isGlobalViewCandidates);

  const [page, departments] = await Promise.all([
    listCandidateWorkspacePage({
      q: params.q?.trim() || undefined,
      roleId: params.roleId?.trim() || undefined,
      departmentId: effectiveDepartmentId,
      stage: isFinalizedView ? "finalized" : selectedStageValues ? undefined : selectedStage,
      stageValues: selectedStageValues,
      orgStage: isFinalizedView ? undefined : "active",
      finalizedAs: params.finalizedAs === "hired" || params.finalizedAs === "rejected"
        ? params.finalizedAs
        : undefined,
      owner: params.owner?.trim() || undefined,
      assessmentStatus: candidateAssessmentStatusValues.includes(params.assessmentStatus as CandidateAssessmentStatus)
        ? (params.assessmentStatus as CandidateAssessmentStatus)
        : undefined,
      sort: (params.sort as "updated_desc" | "updated_asc" | "name_asc" | "stale_desc" | "inbox") || "inbox",
      page: Number(params.page ?? 1),
      pageSize: Number(params.pageSize ?? 12)
    }),
    shouldLoadDepartments ? listDepartments() : Promise.resolve([])
  ]);

  const currentPathAndQuery = nextPath;

  return (
    <>
      <PersistedTableState
        storageKey={scope === "department" && departmentId ? `department-candidates-table-view-${departmentId}` : "people-candidates-table-view"}
        transientKeys={[...transientBannerKeys]}
      />

      <div className="space-y-5">
        <CandidatesViewSwitch
          current={currentCandidatesView(params.stage)}
          scope={scope}
          departmentId={departmentId}
          countsDepartmentId={effectiveDepartmentId}
        />

        {params.deleted ? <NoticeBanner tone="success">Candidate deleted.</NoticeBanner> : null}
        {params.updated ? <NoticeBanner tone="success">Updated {params.updated} candidate(s).</NoticeBanner> : null}
        {params.imported ? (
          <NoticeBanner tone="success">
            Imported {params.imported} candidate(s).
            {params.skipped ? ` Skipped ${params.skipped} duplicate email(s).` : ""}
          </NoticeBanner>
        ) : null}
        {params.error ? <NoticeBanner tone="error">{params.error}</NoticeBanner> : null}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="space-y-0.5">
                <h2 className="text-2xl text-[color:var(--app-heading)]">Candidates</h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Active hiring pipeline
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={`${page.total} total`} tone="neutral" />
                <StatusPill label={`${page.summary.readyForReview} awaiting review`} tone="amber" />
                <StatusPill label={`${page.summary.stalled} stalled`} tone={page.summary.stalled > 0 ? "red" : "neutral"} />
              </div>
            </div>
            {canManageCandidates ? (
              <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                <Link href={
                  (scope === "department" && departmentId
                    ? `/departments/${departmentId}/candidates/new`
                    : "/people/candidates/new") as Route
                }>
                  <Button>Add candidate</Button>
                </Link>
                <CandidateCsvImportModal returnTo={currentPathAndQuery} />
              </div>
            ) : null}
          </div>

          <form className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,0.9fr))_auto_auto]">
            <input type="hidden" name="pageSize" value={params.pageSize ?? String(page.pageSize)} />
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search candidate, email, or owner"
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
            {scope === "global" && isGlobalViewCandidates ? (
              <select
                name="departmentId"
                defaultValue={params.departmentId ?? ""}
                className={filterFieldClassName()}
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              name="owner"
              defaultValue={params.owner ?? ""}
              className={filterFieldClassName()}
            >
              <option value="">All owners</option>
              {page.ownerOptions.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.label}
                </option>
              ))}
            </select>
            <select
              name="assessmentStatus"
              defaultValue={params.assessmentStatus ?? ""}
              className={filterFieldClassName()}
            >
              <option value="">Assessment status</option>
              {candidateAssessmentStatusValues.map((status) => (
                <option key={status} value={status}>
                  {candidateAssessmentStatusLabels[status]}
                </option>
              ))}
            </select>
            {isFinalizedView ? (
              <select
                name="finalizedAs"
                defaultValue={params.finalizedAs ?? ""}
                className={filterFieldClassName()}
              >
                <option value="">All finalized</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            ) : null}
            <select
              name="sort"
              defaultValue={params.sort ?? "inbox"}
              className={filterFieldClassName()}
            >
              <option value="inbox">Sort by</option>
              <option value="updated_desc">Recently updated</option>
              <option value="updated_asc">Least recently updated</option>
              <option value="stale_desc">Longest inactive</option>
              <option value="name_asc">Name (A–Z)</option>
            </select>
            <Button>Apply</Button>
            <Link href={`${basePath}?clearView=1` as Route}>
              <Button type="button" variant="secondary">
                Reset
              </Button>
            </Link>
          </form>

          <div className="flex flex-wrap gap-2">
            <Link href={buildHref(basePath, query, { assessmentStatus: "none", sort: "inbox", page: "1" })}>
              <Button variant="ghost">No assessment</Button>
            </Link>
            <Link href={buildHref(basePath, query, { sort: "stale_desc", page: "1" })}>
              <Button variant="ghost">Longest inactive</Button>
            </Link>
          </div>
        </div>

        {page.rows.length === 0 ? (
          <StagePanel tone="open" className="space-y-3">
            <h2 className="text-2xl text-[color:var(--app-heading)]">No candidates</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              {scope === "department"
                ? "Add or import candidates to start tracking the hiring pipeline for this department."
                : "Candidates appear here after applications are reviewed or records are added."}
            </p>
            <div className="flex flex-wrap gap-3">
              {canManageCandidates ? (
                <Link href={
                  (scope === "department" && departmentId
                    ? `/departments/${departmentId}/candidates/new`
                    : "/people/candidates/new") as Route
                }>
                  <Button>Add candidate</Button>
                </Link>
              ) : null}
              <Link href={`${basePath}?clearView=1` as Route}>
                <Button variant="secondary">Reset filters</Button>
              </Link>
            </div>
          </StagePanel>
        ) : (
          <CandidateWorkspaceTable
            rows={page.rows}
            currentPathAndQuery={currentPathAndQuery}
            workspaceId={scope === "department" ? departmentId : undefined}
            roleOptions={page.roleOptions}
            departmentOptions={departments.map((department) => ({ id: department.id, name: department.name }))}
            permissions={session.permissions}
          />
        )}

        <PaginationBar
          page={page.page}
          pageSize={page.pageSize}
          total={page.total}
          makeHref={(nextPage) => buildHref(basePath, query, { page: String(nextPage) })}
        />
      </div>
    </>
  );
}
