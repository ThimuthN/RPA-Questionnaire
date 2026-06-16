import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { ApplicantsTable } from "@/components/candidates/ApplicantsTable";
import { ApplicantFilterForm } from "@/components/candidates/ApplicantFilterForm";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { StagePanel } from "@/components/scene/StagePanel";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { ActiveFilterChips, type ActiveFilterChipItem } from "@/components/workspace/ActiveFilterChips";
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
  resume?: string;
  page?: string;
  pageSize?: string;
  updated?: string;
  error?: string;
};

function messageTone(type: "success" | "error") {
  return type === "success"
    ? "rounded-[20px] border border-[color:var(--pill-emerald-border)] bg-[color:var(--pill-emerald-bg)] p-4 text-sm text-[color:var(--pill-emerald-text)]"
    : "rounded-[20px] border border-[color:var(--pill-red-border)] bg-[color:var(--pill-red-bg)] p-4 text-sm text-[color:var(--pill-red-text)]";
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
    resume: readSearchParam(searchParams, "resume"),
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
  const hasFilters = Boolean(params.q?.trim() || params.jobId?.trim() || params.status?.trim() || params.resume === "missing");

  const [page, users] = await Promise.all([
    listApplicantWorkspacePage({
      q: params.q?.trim() || undefined,
      jobId: params.jobId?.trim() || undefined,
      status:
        params.status === "submitted" || params.status === "under_review" || params.status === "closed"
          ? (params.status as CandidateApplicationStatus)
          : undefined,
      resumeMissing: params.resume === "missing",
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

  const activeFilters: ActiveFilterChipItem[] = [];
  const selectedJob = params.jobId?.trim()
    ? page.jobOptions.find((job) => job.id === params.jobId?.trim())?.label ?? params.jobId.trim()
    : null;
  const statusLabel =
    params.status === "submitted"
      ? "Applied"
      : params.status === "under_review"
        ? "Under review"
        : params.status === "closed"
          ? "Archived"
          : null;

  if (params.q?.trim()) {
    activeFilters.push({
      label: `Search: ${params.q.trim()}`,
      clearHref: buildHref(basePath, query, { q: undefined, page: "1" })
    });
  }

  if (selectedJob) {
    activeFilters.push({
      label: `Job: ${selectedJob}`,
      clearHref: buildHref(basePath, query, { jobId: undefined, page: "1" })
    });
  }

  if (statusLabel) {
    activeFilters.push({
      label: `Status: ${statusLabel}`,
      clearHref: buildHref(basePath, query, { status: undefined, page: "1" })
    });
  }

  if (params.resume === "missing") {
    activeFilters.push({
      label: "Resume: Missing",
      clearHref: buildHref(basePath, query, { resume: undefined, page: "1" })
    });
  }

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

      <ApplicantFilterForm
        action={basePath}
        resetHref={basePath}
        initialValues={{
          q: params.q,
          jobId: params.jobId,
          status: params.status,
          resume: params.resume
        }}
        jobOptions={page.jobOptions.map((job) => ({ value: job.id, label: job.label }))}
        pageSize={params.pageSize ?? String(page.pageSize)}
      />

      <ActiveFilterChips items={activeFilters} clearAllHref={basePath} />

      <div className="flex flex-wrap gap-2">
        <Link href={buildHref(basePath, query, { status: "submitted", page: "1" })}>
          <Button variant="ghost">Applied {page.summary.submitted}</Button>
        </Link>
        <Link href={buildHref(basePath, query, { status: "under_review", page: "1" })}>
          <Button variant="ghost">Under review {page.summary.underReview}</Button>
        </Link>
        <Link href={buildHref(basePath, query, { resume: "missing", page: "1" })}>
          <Button variant="ghost">Missing resume {page.summary.resumeMissing}</Button>
        </Link>
      </div>

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
