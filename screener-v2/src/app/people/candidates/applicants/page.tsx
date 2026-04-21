import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { listApplicantWorkspacePage } from "@/lib/db/jobs";
import { candidateApplicationStatusLabels, type CandidateApplicationStatus } from "@/lib/jobs/types";

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

function statusTone(status: CandidateApplicationStatus): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "submitted") return "neutral";
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  return "blue";
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
  await requirePageSession(nextPath);

  const page = await listApplicantWorkspacePage({
    q: params.q?.trim() || undefined,
    jobId: params.jobId?.trim() || undefined,
    status:
      params.status === "submitted" || params.status === "under_review" || params.status === "closed"
        ? (params.status as CandidateApplicationStatus)
        : undefined,
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 12)
  });

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="People"
      title="Candidates"
      subtitle="Review external applicants before moving them into the active pipeline."
      utility={<PeopleViewSwitch current="candidates" />}
    >
      <div className="space-y-5">
        <CandidatesViewSwitch current="applicants" />

        {params.updated ? <NoticeBanner tone="success">Application updated.</NoticeBanner> : null}
        {params.error ? <NoticeBanner tone="error">{params.error}</NoticeBanner> : null}

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
            placeholder="Search name, email, or job"
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
            <option value="">Active statuses</option>
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

        {page.rows.length === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-[color:var(--app-heading)]">No applicants in this view</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Published jobs will start filling this queue when people apply.</p>
          </StagePanel>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full table-fixed text-left">
                <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                  <tr>
                    <th className="w-[22%] px-4 py-3 font-medium">Person</th>
                    <th className="w-[20%] px-4 py-3 font-medium">Applied job</th>
                    <th className="w-[12%] px-4 py-3 font-medium">Applied</th>
                    <th className="w-[10%] px-4 py-3 font-medium">Resume</th>
                    <th className="w-[12%] px-4 py-3 font-medium">Status</th>
                    <th className="w-[10%] px-4 py-3 font-medium">Owner</th>
                    <th className="w-[14%] px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr key={row.id} className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-surface-soft)]/70">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">{row.candidateName}</p>
                          <p className="text-xs text-[color:var(--app-muted)]">{row.candidateEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-[color:var(--app-heading)]">{row.jobTitle}</p>
                          <p className="text-xs text-[color:var(--app-muted)]">{row.roleLabel || "No role linked"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[color:var(--app-text)]">{new Date(row.appliedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <StatusPill label={row.hasResume ? "Attached" : "Missing"} tone={row.hasResume ? "emerald" : "amber"} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill label={candidateApplicationStatusLabels[row.status]} tone={statusTone(row.status)} />
                      </td>
                      <td className="px-4 py-4 text-sm text-[color:var(--app-text)]">{row.candidateOwner || "Unassigned"}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <form action={`/api/candidate-applications/${row.id}`} method="post">
                            <input type="hidden" name="action" value="review" />
                            <input type="hidden" name="returnTo" value={`/candidates/${row.candidateId}` as Route} />
                            <Button type="submit" variant="ghost" className="px-3 py-2 text-xs">
                              Review
                            </Button>
                          </form>
                          <form action={`/api/candidate-applications/${row.id}`} method="post">
                            <input type="hidden" name="action" value="promote" />
                            <input type="hidden" name="returnTo" value={nextPath} />
                            <Button type="submit" className="px-3 py-2 text-xs">
                              Move to pipeline
                            </Button>
                          </form>
                          <form action={`/api/candidate-applications/${row.id}`} method="post">
                            <input type="hidden" name="action" value="close" />
                            <input type="hidden" name="returnTo" value={nextPath} />
                            <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                              Close
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SceneShell>
  );
}
