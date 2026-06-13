import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { ApplicantsTable } from "@/components/candidates/ApplicantsTable";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { StagePanel } from "@/components/scene/StagePanel";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { requirePageSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";
import { listApplicantWorkspacePage } from "@/lib/db/jobs";
import { type CandidateApplicationStatus } from "@/lib/jobs/types";
import { type RouteSearchParams, readSearchParam, toSearchParamEntries } from "@/lib/http/search-params";

type ApplicantWorkspacePageState = {
  q?: string;
  jobId?: string;
  status?: string;
  page?: string;
  pageSize?: string;
  updated?: string;
  error?: string;
};

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

function normalizeSearchParams(searchParams: RouteSearchParams): ApplicantWorkspacePageState {
  return {
    q: readSearchParam(searchParams, "q"),
    jobId: readSearchParam(searchParams, "jobId"),
    status: readSearchParam(searchParams, "status"),
    page: readSearchParam(searchParams, "page"),
    pageSize: readSearchParam(searchParams, "pageSize"),
    updated: readSearchParam(searchParams, "updated"),
    error: readSearchParam(searchParams, "error")
  };
}

function basePathForScope(scope: "global" | "department", departmentId?: string) {
  return scope === "department" && departmentId
    ? (`/departments/${departmentId}/applicants` as Route)
    : ("/people/candidates/applicants" as Route);
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

export type ApplicantWorkspaceViewProps = {
  scope: "global" | "department";
  departmentId?: string;
  departmentName?: string;
  searchParams: Record<string, string | string[] | undefined>;
};

export async function ApplicantWorkspaceView({
  scope,
  departmentId,
  searchParams
}: ApplicantWorkspaceViewProps) {
  const params = normalizeSearchParams(searchParams);
  const basePath = basePathForScope(scope, departmentId);
  const query = new URLSearchParams(
    toSearchParamEntries(searchParams, { omitKeys: ["updated", "error"] })
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

  const isGlobalViewCandidates =
    scope === "global" && session.userId
      ? await hasGlobalPermission(session.userId, "view_candidates")
      : false;
  const effectiveDepartmentId =
    scope === "department"
      ? departmentId
      : isGlobalViewCandidates
        ? undefined
        : session.departmentId ?? undefined;
  const hasFilters = Boolean(params.q?.trim() || params.jobId?.trim() || params.status?.trim());

  const [page, users] = await Promise.all([
    listApplicantWorkspacePage({
      q: params.q?.trim() || undefined,
      jobId: params.jobId?.trim() || undefined,
      status:
        params.status === "submitted" || params.status === "under_review" || params.status === "closed"
          ? (params.status as CandidateApplicationStatus)
          : undefined,
      departmentId: effectiveDepartmentId,
      page: Number(params.page ?? 1),
      pageSize: Number(params.pageSize ?? 12)
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className="space-y-5">
      <CandidatesViewSwitch
        current="applicants"
        scope={scope}
        departmentId={departmentId}
        countsDepartmentId={effectiveDepartmentId}
      />

      {params.updated ? <NoticeBanner tone="success">Application updated.</NoticeBanner> : null}
      {params.error ? <NoticeBanner tone="error">{params.error}</NoticeBanner> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-2xl text-[color:var(--app-heading)]">Applications</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            Submitted applications awaiting review.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center divide-x divide-[color:var(--app-border)] rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
          <StatCell label="Total" value={page.summary.total} />
          <StatCell label="Applied" value={page.summary.submitted} />
          <StatCell label="In review" value={page.summary.underReview} />
          <StatCell label="No resume" value={page.summary.resumeMissing} highlight={page.summary.resumeMissing > 0} />
        </div>
      </div>

      <form className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto_auto]">
        <input type="hidden" name="pageSize" value={params.pageSize ?? String(page.pageSize)} />
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search applicant, email, or job"
          className={filterFieldClassName()}
        />
        <select name="jobId" defaultValue={params.jobId ?? ""} className={filterFieldClassName()}>
          <option value="">All jobs</option>
          {page.jobOptions.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className={filterFieldClassName()}>
          <option value="">All statuses</option>
          <option value="submitted">Applied</option>
          <option value="under_review">Under review</option>
          <option value="closed">Archived</option>
        </select>
        <Button>Apply</Button>
        <Link href={basePath}>
          <Button type="button" variant="secondary">
            Reset
          </Button>
        </Link>
      </form>

      {page.total === 0 ? (
        <StagePanel tone="open" className="space-y-3">
          <h2 className="text-2xl text-[color:var(--app-heading)]">No applications yet</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            {hasFilters
              ? "No applications match the current filters. Try adjusting your search."
              : "Applications will appear here once candidates apply to a published job."}
          </p>
        </StagePanel>
      ) : (
        <>
          <ApplicantsTable
            rows={page.rows}
            users={users}
            scope={scope}
            departmentId={departmentId}
          />
          <PaginationBar
            page={page.page}
            pageSize={page.pageSize}
            total={page.total}
            makeHref={(nextPage) => buildHref(basePath, query, { page: String(nextPage) })}
          />
        </>
      )}
    </div>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5">
      <span className={`text-xl font-semibold leading-none ${highlight ? "text-amber-400" : "text-[color:var(--app-heading)]"}`}>
        {value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
        {label}
      </span>
    </div>
  );
}
