import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { ApplicantsTable } from "@/components/candidates/ApplicantsTable";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { PaginationBar } from "@/components/workspace/PaginationBar";
import { requirePageSession } from "@/lib/auth/guards";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { listApplicantWorkspacePage } from "@/lib/db/jobs";
import { type CandidateApplicationStatus } from "@/lib/jobs/types";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type PageState = {
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

function buildHref(params: URLSearchParams, overrides: Record<string, string | undefined>): Route {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  return `/people/candidates/applicants${next.toString() ? `?${next.toString()}` : ""}` as Route;
}

export default async function CandidateApplicantsPage({
  searchParams
}: {
  searchParams: Promise<PageState>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([key, value]) => typeof value === "string" && value.length > 0 && key !== "updated" && key !== "error")
      .map(([key, value]) => [key, value as string])
  );
  const nextPath = `/people/candidates/applicants${query.toString() ? `?${query.toString()}` : ""}`;
  const session = await requirePageSession(nextPath);

  if (!session.permissions.includes("view_candidates")) {
    redirect("/people");
  }
  const hasFilters = Boolean(params.q?.trim() || params.jobId?.trim() || params.status?.trim());

  const isGlobalViewCandidates = await hasGlobalPermission(session.userId!, "view_candidates");
  const effectiveDeptId = isGlobalViewCandidates ? undefined : session.departmentId;

  const [page, users] = await Promise.all([
    listApplicantWorkspacePage({
      q: params.q?.trim() || undefined,
      jobId: params.jobId?.trim() || undefined,
      status:
        params.status === "submitted" || params.status === "under_review" || params.status === "closed"
          ? (params.status as CandidateApplicationStatus)
          : undefined,
      departmentId: effectiveDeptId,
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
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Hiring"
      title="Applicants"
      subtitle="Review people who applied to published jobs before moving them into the candidate pipeline."
      utility={<PeopleViewSwitch current="candidates" />}
    >
      <div className="space-y-5">
        <CandidatesViewSwitch current="applicants" />

        {params.updated ? <NoticeBanner tone="success">Application updated.</NoticeBanner> : null}
        {params.error ? <NoticeBanner tone="error">{params.error}</NoticeBanner> : null}

        <div className="space-y-1">
          <h2 className="text-2xl text-[color:var(--app-heading)]">Application queue</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            Applicants are people attached to a submitted job application. Move only qualified applications into the candidate pipeline.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Applicants</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{page.summary.total}</p>
          </div>
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Submitted</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{page.summary.submitted}</p>
          </div>
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Under review</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{page.summary.underReview}</p>
          </div>
          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Resume missing</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{page.summary.resumeMissing}</p>
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
            <option value="">All application statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="closed">Closed</option>
          </select>
          <Button>Apply</Button>
          <Link href="/people/candidates/applicants">
            <Button type="button" variant="secondary">
              Reset
            </Button>
          </Link>
        </form>

        {page.total === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-[color:var(--app-heading)]">No applicants in this view</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              {hasFilters
                ? "No applicants match the current filters. Clear the filters or choose a different job or status."
                : "Published jobs will fill this queue when candidates apply."}
            </p>
          </StagePanel>
        ) : (
          <>
            <ApplicantsTable rows={page.rows} users={users} />
            <PaginationBar
              page={page.page}
              pageSize={page.pageSize}
              total={page.total}
              makeHref={(nextPage) => buildHref(query, { page: String(nextPage) })}
            />
          </>
        )}
      </div>
    </SceneShell>
  );
}
