import type { Route } from "next";
import { ApplicantsTable } from "@/components/candidates/ApplicantsTable";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { getDepartment } from "@/lib/db/departments";
import { listApplicantWorkspacePage } from "@/lib/db/jobs";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
import { requirePageSession } from "@/lib/auth/guards";
import { requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

type PageState = {
  q?: string;
  jobId?: string;
  status?: string;
  page?: string;
  pageSize?: string;
};

function filterFieldClassName() {
  return "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";
}

function buildHref(departmentId: string, params: URLSearchParams, overrides: Record<string, string | undefined>): Route {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  return `/departments/${departmentId}/applicants${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

export default async function DepartmentApplicantsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PageState>;
}) {
  const { id } = await params;
  const pageState = await searchParams;
  const query = new URLSearchParams(
    Object.entries(pageState)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, value as string])
  );

  const session = await requirePageSession(`/departments/${id}/applicants`);
  const permResult = await requirePermissionForDepartment(session, "view_candidates", id);
  if (!permResult.ok) {
    notFound();
  }

  const [department, page, users] = await Promise.all([
    getDepartment(id),
    listApplicantWorkspacePage({
      q: pageState.q?.trim() || undefined,
      jobId: pageState.jobId?.trim() || undefined,
      status:
        pageState.status === "submitted" || pageState.status === "under_review" || pageState.status === "closed"
          ? (pageState.status as CandidateApplicationStatus)
          : undefined,
      departmentId: id,
      page: Number(pageState.page ?? 1),
      pageSize: Number(pageState.pageSize ?? 12)
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    })
  ]);

  if (!department) {
    notFound();
  }
  const hasFilters = Boolean(pageState.q?.trim() || pageState.jobId?.trim() || pageState.status?.trim());

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Applicants</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Review applications and move qualified candidates into the pipeline.
        </p>
      </div>

      <form className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <input type="hidden" name="pageSize" value={pageState.pageSize ?? String(page.pageSize)} />
        <input
          name="q"
          defaultValue={pageState.q ?? ""}
          placeholder="Search applicant, email, or job"
          className={filterFieldClassName()}
        />
        <select name="jobId" defaultValue={pageState.jobId ?? ""} className={filterFieldClassName()}>
          <option value="">All jobs</option>
          {page.jobOptions.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={pageState.status ?? ""} className={filterFieldClassName()}>
          <option value="">All application statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="closed">Closed</option>
        </select>
      </form>

      {page.total === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-center text-sm text-[color:var(--app-muted)]">
          {hasFilters
            ? "No applicants match the current department filters."
            : "No applicants in this department yet."}
        </div>
      ) : (
        <>
          <ApplicantsTable rows={page.rows} users={users} />
          <PaginationBar
            page={page.page}
            pageSize={page.pageSize}
            total={page.total}
            makeHref={(nextPage) => buildHref(id, query, { page: String(nextPage) })}
          />
        </>
      )}
    </div>
  );
}
