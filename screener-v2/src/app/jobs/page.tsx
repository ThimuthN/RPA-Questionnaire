import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { listPublicJobPostings } from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const updatedAtFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export default async function PublicJobsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; department?: string; sort?: string }>;
}) {
  if (!PUBLIC_JOBS_ENABLED) {
    notFound();
  }

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Northstar";
  const params = await searchParams;
  const allJobs = await listPublicJobPostings();
  const departments = Array.from(
    new Set(allJobs.map((job) => job.roleDepartment).filter(Boolean))
  ).slice(0, 6) as string[];

  const jobs =
    params.q || params.department || params.sort
      ? await listPublicJobPostings({
          q: params.q?.trim(),
          department: params.department?.trim(),
          sort:
            params.sort === "updated_asc" || params.sort === "title_asc"
              ? params.sort
              : "updated_desc"
        })
      : allJobs;

  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([_, value]) => typeof value === "string" && value.length > 0
    )
  );

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams(query.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    return `/jobs${next.toString() ? `?${next.toString()}` : ""}` as Route;
  };

  const resultsLabel =
    jobs.length === allJobs.length
      ? `${jobs.length} open ${jobs.length === 1 ? "role" : "roles"}`
      : `Showing ${jobs.length} of ${allJobs.length} roles`;

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow={`${orgName} careers`}
      title="Find your next role"
      subtitle="Browse open roles and apply online."
    >
      <div className="space-y-6">
        {allJobs.length === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-[color:var(--app-heading)]">No open roles</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              Check back later for new opportunities.
            </p>
          </StagePanel>
        ) : (
          <div className="space-y-6">
            <StagePanel className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <p className="text-2xl font-semibold text-[color:var(--app-heading)]">
                  {resultsLabel}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={buildHref({ department: undefined })}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      !params.department
                        ? "border border-brand-300 bg-brand-400/10 text-brand-200"
                        : "border border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-text)] hover:border-brand-300/60"
                    }`}
                  >
                    All departments
                  </Link>
                  {departments.map((department) => (
                    <Link
                      key={department}
                      href={buildHref({ department })}
                      className={`rounded-full px-3 py-2 text-sm transition ${
                        params.department === department
                          ? "border border-brand-300 bg-brand-400/10 text-brand-200"
                          : "border border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-text)] hover:border-brand-300/60"
                      }`}
                    >
                      {department}
                    </Link>
                  ))}
                </div>
              </div>
              <form className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_1fr_1fr_auto]">
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search by title, team, or skill"
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
                />
                <select
                  name="department"
                  defaultValue={params.department ?? ""}
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <select
                  name="sort"
                  defaultValue={params.sort ?? "updated_desc"}
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
                >
                  <option value="updated_desc">Most recent</option>
                  <option value="updated_asc">Oldest</option>
                  <option value="title_asc">A-Z title</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-[18px] bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-400"
                >
                  Filter
                </button>
              </form>
            </StagePanel>

            {jobs.length === 0 ? (
              <StagePanel className="space-y-3">
                <h2 className="text-lg text-[color:var(--app-heading)]">No matching roles</h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Try adjusting your search or{" "}
                  <Link href="/jobs" className="underline hover:text-[color:var(--app-text)]">
                    clear filters
                  </Link>
                  .
                </p>
              </StagePanel>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const salaryLabel =
                    job.salaryMin && job.salaryMax
                      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
                      : job.salaryMin
                        ? `From $${(job.salaryMin / 1000).toFixed(0)}k`
                        : null;
                  return (
                    <StagePanel key={job.id} tone="open" className="space-y-4 p-5">
                      <div className="space-y-3">
                        <h2 className="text-xl text-[color:var(--app-heading)]">{job.title}</h2>
                        <div className="flex flex-wrap items-center gap-2">
                          {job.roleDepartment ? (
                            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1 text-sm text-[color:var(--app-text)]">
                              {job.roleDepartment}
                            </span>
                          ) : null}
                          {job.roleLabel ? (
                            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1 text-sm text-[color:var(--app-text)]">
                              {job.roleLabel}
                            </span>
                          ) : null}
                          {job.remotePolicy ? (
                            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1 text-sm text-[color:var(--app-text)]">
                              {job.remotePolicy}
                            </span>
                          ) : null}
                          {salaryLabel ? (
                            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1 text-sm text-[color:var(--app-text)]">
                              {salaryLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm leading-6 text-[color:var(--app-muted)]">{job.summary}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-[color:var(--app-border)] pt-4">
                        <p className="text-xs text-[color:var(--app-muted)]">
                          Updated {updatedAtFormatter.format(new Date(job.updatedAt))}
                        </p>
                        <Link href={`/jobs/${job.slug}`}>
                          <Button>
                            View role
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </StagePanel>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </SceneShell>
  );
}
