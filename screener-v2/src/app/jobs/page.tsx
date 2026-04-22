import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, FileText, UserRoundSearch } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { listPublicJobPostings } from "@/lib/db/jobs";

export const dynamic = "force-dynamic";

const updatedAtFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export default async function PublicJobsPage() {
  const jobs = await listPublicJobPostings();
  const featuredJob = jobs[0] ?? null;
  const departments = Array.from(new Set(jobs.map((job) => job.roleDepartment).filter(Boolean))).slice(0, 4);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Northstar careers"
      title="Find your next role at Northstar"
      subtitle="Browse open positions, review the role details, and apply from the same page with a clean public application flow."
    >
      <div className="space-y-6">
        {jobs.length === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-[color:var(--app-heading)]">No openings right now</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Check back later for new roles.</p>
          </StagePanel>
        ) : (
          <div className="space-y-6">
            <StagePanel className="overflow-hidden p-0">
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_320px]">
                <div className="space-y-6 p-6 md:p-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-brand-200">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    Now hiring
                  </div>
                  <div className="space-y-3">
                    <h2 className="max-w-3xl text-4xl font-display leading-[1.02] text-[color:var(--app-heading)] md:text-[3.35rem]">
                      Explore public openings and apply without bouncing between pages.
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)] md:text-[15px]">
                      The experience is built to feel familiar: review the role, scan the essentials, and submit one
                      clean application directly from the job page.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                        Open positions
                      </p>
                      <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{jobs.length}</p>
                    </div>
                    <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                        Application flow
                      </p>
                      <p className="mt-2 text-base text-[color:var(--app-heading)]">Direct from each role page</p>
                    </div>
                    <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                        Teams hiring
                      </p>
                      <p className="mt-2 text-base text-[color:var(--app-heading)]">
                        {departments.length > 0 ? departments.join(", ") : "Multiple teams"}
                      </p>
                    </div>
                  </div>

                  {featuredJob ? (
                    <div className="rounded-[26px] border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_14%,var(--app-surface)),var(--app-surface-soft))] p-5 shadow-[var(--app-shadow-soft)]">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                        <span>Featured opening</span>
                        <span className="text-[color:var(--app-brand)]">Northstar</span>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-2xl text-[color:var(--app-heading)]">{featuredJob.title}</h3>
                          <p className="text-sm leading-6 text-[color:var(--app-muted)]">{featuredJob.summary}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--app-text)]">
                          {featuredJob.roleLabel ? (
                            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1">
                              {featuredJob.roleLabel}
                            </span>
                          ) : null}
                          {featuredJob.roleDepartment ? (
                            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1">
                              {featuredJob.roleDepartment}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--app-border)] pt-4">
                          <p className="text-sm text-[color:var(--app-text)]">
                            Updated {updatedAtFormatter.format(new Date(featuredJob.updatedAt))}
                          </p>
                          <Link href={`/jobs/${featuredJob.slug}`}>
                            <Button>View role</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-6 xl:border-l xl:border-t-0">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                        Candidate experience
                      </p>
                      <h3 className="text-2xl text-[color:var(--app-heading)]">A clear, modern apply flow</h3>
                      <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                        Everything candidates need is surfaced up front so the role page feels more like a polished
                        hiring platform than an internal tool.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          icon: FileText,
                          title: "Read the role quickly",
                          body: "Each listing leads to a dedicated page with the core details and full description."
                        },
                        {
                          icon: UserRoundSearch,
                          title: "Apply in one place",
                          body: "Candidates can share contact details, upload a resume, and leave a note in one form."
                        },
                        {
                          icon: Building2,
                          title: "Stay on the brand page",
                          body: "The whole public flow lives under Northstar without extra redirects or log-in steps."
                        }
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.title}
                            className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-[color:var(--app-heading)]">{item.title}</p>
                                <p className="text-sm leading-6 text-[color:var(--app-muted)]">{item.body}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </StagePanel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                {jobs.map((job) => (
                  <StagePanel
                    key={job.id}
                    tone="open"
                    className="overflow-hidden rounded-[30px] border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-0"
                  >
                    <div className="space-y-5 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                          <Building2 className="h-3.5 w-3.5" />
                          Northstar
                        </div>
                        <p className="text-sm text-[color:var(--app-muted)]">
                          Updated {updatedAtFormatter.format(new Date(job.updatedAt))}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <h2 className="text-2xl text-[color:var(--app-heading)]">{job.title}</h2>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--app-text)]">
                            {job.roleLabel ? (
                              <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1">
                                {job.roleLabel}
                              </span>
                            ) : null}
                            {job.roleDepartment ? (
                              <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1">
                                {job.roleDepartment}
                              </span>
                            ) : null}
                            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1">
                              {job.applicantCount > 0 ? `${job.applicantCount} in review` : "Open for applications"}
                            </span>
                          </div>
                        </div>
                        <p className="max-w-3xl text-sm leading-7 text-[color:var(--app-muted)]">{job.summary}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--app-border)] pt-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">Dedicated role page</p>
                          <p className="text-sm text-[color:var(--app-muted)]">
                            Review the details first, then apply from the same screen.
                          </p>
                        </div>
                        <Link href={`/jobs/${job.slug}`}>
                          <Button>
                            View details
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </StagePanel>
                ))}
              </div>

              <StagePanel tone="summary" className="h-fit space-y-4 xl:sticky xl:top-6">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                    Careers overview
                  </p>
                  <h3 className="text-2xl text-[color:var(--app-heading)]">Apply through a clean public workflow</h3>
                </div>
                <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                  The board is designed to be shareable. Send candidates here, let them open a role, and keep the
                  application experience simple and focused.
                </p>
                <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                  <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Open roles</p>
                    <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{jobs.length}</p>
                  </div>
                  <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Best way to share</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--app-muted)]">
                      Send candidates to the full careers page or directly to a specific role link when you already know
                      the opening.
                    </p>
                  </div>
                </div>
              </StagePanel>
            </div>
          </div>
        )}
      </div>
    </SceneShell>
  );
}
