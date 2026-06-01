import { ApplicantsTable } from "@/components/candidates/ApplicantsTable";
import { getDepartment } from "@/lib/db/departments";
import { listApplicantWorkspacePage } from "@/lib/db/jobs";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
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

export default async function DepartmentApplicantsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PageState>;
}) {
  const { id } = await params;
  const pageState = await searchParams;

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
          <option value="">Open application statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="closed">Closed</option>
        </select>
      </form>

      {page.rows.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-center text-sm text-[color:var(--app-muted)]">
          No applicants in this department yet.
        </div>
      ) : (
        <ApplicantsTable rows={page.rows} users={users} />
      )}
    </div>
  );
}
