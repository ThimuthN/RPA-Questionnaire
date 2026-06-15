import type { Route } from "next";
import Link from "next/link";
import { DollarSign, Search } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { PublicSiteFrame } from "@/components/marketing/PublicSiteFrame";
import { listPublicJobPostings } from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";
import { getAppSession } from "@/lib/auth/app-session";
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
  if (!PUBLIC_JOBS_ENABLED) notFound();

  const session = await getAppSession();
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Northstar";
  const params = await searchParams;
  const allJobs = await listPublicJobPostings();
  const departments = Array.from(
    new Set(allJobs.map((job) => job.roleDepartment).filter(Boolean))
  ).slice(0, 8) as string[];

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
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    return `/jobs${next.toString() ? `?${next.toString()}` : ""}` as Route;
  };

  const isFiltered = Boolean(params.q || params.department || params.sort);
  const resultsLabel = isFiltered
    ? `${jobs.length} of ${allJobs.length} ${allJobs.length === 1 ? "role" : "roles"}`
    : `${allJobs.length} open ${allJobs.length === 1 ? "role" : "roles"}`;

  return (
    <PublicSiteFrame current="careers" backHref={session ? "/departments" : undefined}>
      <div className="space-y-8">
        {/* Page header */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--pub-brand)]">{orgName} Careers</p>
          <h1 className="font-display text-3xl font-semibold text-[color:var(--app-heading)] sm:text-4xl">Find your next role</h1>
          <p className="text-sm text-[color:var(--app-muted)]">Browse open positions and apply directly online.</p>
        </div>

        <div>

        {/* ── Search + filter bar ── */}
        <div className="space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--app-muted)]" />
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search by title, team, or skill"
                className="w-full rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] py-3 pl-11 pr-5 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
              />
            </label>
            <select
              name="department"
              defaultValue={params.department ?? ""}
              className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-5 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={params.sort ?? "updated_desc"}
              className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-5 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50"
            >
              <option value="updated_desc">Most recent</option>
              <option value="updated_asc">Oldest</option>
              <option value="title_asc">A–Z</option>
            </select>
            <button
              type="submit"
              className="rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-400 active:scale-95"
            >
              Search
            </button>
          </form>

          {/* Dept chips + count */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-[color:var(--app-muted)]">{resultsLabel}</span>
            <Link
              href={buildHref({ department: undefined })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                !params.department
                  ? "bg-brand-400/15 text-brand-300 ring-1 ring-brand-300/40"
                  : "text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
              }`}
            >
              All
            </Link>
            {departments.map((dept) => (
              <Link
                key={dept}
                href={buildHref({ department: dept })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  params.department === dept
                    ? "bg-brand-400/15 text-brand-300 ring-1 ring-brand-300/40"
                    : "text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
                }`}
              >
                {dept}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Job list ── */}
        {allJobs.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-lg font-semibold text-[color:var(--app-heading)]">No open roles</p>
            <p className="text-sm text-[color:var(--app-muted)]">Check back later for new opportunities.</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-base font-semibold text-[color:var(--app-heading)]">No matching roles</p>
            <p className="text-sm text-[color:var(--app-muted)]">
              <Link href="/jobs" className="underline hover:text-[color:var(--app-text)]">
                Clear filters
              </Link>{" "}
              to see all open roles.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const salaryLabel =
                job.salaryMin && job.salaryMax
                  ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
                  : job.salaryMin
                    ? `$${(job.salaryMin / 1000).toFixed(0)}k+`
                    : null;

              const meta = [job.roleDepartment, job.remotePolicy]
                .filter(Boolean)
                .join(" · ");

              return (
                <article
                  key={job.id}
                  className="group flex items-start gap-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 transition-all hover:border-brand-300/30 hover:bg-[color:var(--app-surface-soft)] hover:shadow-lg hover:shadow-black/20"
                >
                  {/* Company avatar */}
                  <div className="h-12 w-12 shrink-0 rounded-xl border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_18%,var(--app-surface-soft)),var(--app-surface-muted))] flex items-center justify-center text-base font-bold text-[color:var(--app-brand)]">
                    {orgName.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-[color:var(--app-heading)] group-hover:text-brand-200 transition-colors leading-snug">
                          {job.title}
                        </h2>
                        <p className="mt-0.5 text-sm text-[color:var(--app-muted)]">
                          {orgName}{meta ? ` · ${meta}` : ""}
                        </p>
                      </div>
                      <Link href={`/jobs/${job.slug}` as Route} className="shrink-0 mt-0.5">
                        <Button variant="secondary">View role</Button>
                      </Link>
                    </div>

                    {job.summary ? (
                      <p className="mt-2 text-sm leading-6 text-[color:var(--app-muted)] line-clamp-2">
                        {job.summary}
                      </p>
                    ) : null}

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--app-muted)]">
                      {salaryLabel ? (
                        <span className="flex items-center gap-1 text-[color:var(--app-text)]">
                          <DollarSign className="h-3 w-3" />
                          {salaryLabel}
                        </span>
                      ) : null}
                      {job.roleLabel ? <span>{job.roleLabel}</span> : null}
                      <span>Updated {updatedAtFormatter.format(new Date(job.updatedAt))}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </PublicSiteFrame>
  );
}
