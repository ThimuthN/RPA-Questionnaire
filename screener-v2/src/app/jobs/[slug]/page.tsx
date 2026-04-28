import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BriefcaseBusiness, Building2, CheckCircle2, Clock3, FileText } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { JobDescriptionContent } from "@/components/jobs/JobDescriptionContent";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getPublicJobPostingBySlug } from "@/lib/db/jobs";

export const dynamic = "force-dynamic";

const updatedAtFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export default async function PublicJobDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ applied?: string; alreadyApplied?: string; resumeError?: string; error?: string }>;
}) {
  const { slug } = await params;
  const pageState = await searchParams;
  const job = await getPublicJobPostingBySlug(slug);

  if (!job) {
    notFound();
  }

  const hasConfirmation = Boolean(pageState.applied || pageState.alreadyApplied);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Northstar careers"
      title={job.title}
      subtitle={job.summary}
      utility={
        <>
          <Link href="/jobs">
            <Button variant="secondary">All roles</Button>
          </Link>
          {!hasConfirmation ? (
            <Link href="#apply">
              <Button>Easy apply</Button>
            </Link>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <div className="space-y-6">
          <StagePanel className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--app-text)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5">
                <Building2 className="h-4 w-4 text-[color:var(--app-brand)]" />
                Northstar
              </span>
              {job.roleLabel ? (
                <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5">
                  {job.roleLabel}
                </span>
              ) : null}
              {job.roleDepartment ? (
                <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5">
                  {job.roleDepartment}
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Company</p>
                <p className="mt-2 text-base text-[color:var(--app-heading)]">Northstar</p>
              </div>
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Apply from</p>
                <p className="mt-2 text-base text-[color:var(--app-heading)]">This role page</p>
              </div>
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Updated</p>
                <p className="mt-2 text-base text-[color:var(--app-heading)]">
                  {updatedAtFormatter.format(new Date(job.updatedAt))}
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-[26px] border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_12%,var(--app-surface)),var(--app-surface-soft))] p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Role snapshot</p>
                <h2 className="text-2xl text-[color:var(--app-heading)]">A focused application experience</h2>
                <p className="text-sm leading-7 text-[color:var(--app-muted)]">
                  Review the role first, then use the easy-apply panel to send your details directly into the hiring
                  workflow.
                </p>
              </div>
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">What to expect</p>
                    <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                      Read the full description, complete the application card, and submit in one pass.
                    </p>
                    <p className="text-sm text-[color:var(--app-text)]">
                      {job.applicantCount > 0 ? `${job.applicantCount} application${job.applicantCount === 1 ? "" : "s"} already in review.` : "No applications yet — be one of the first candidates."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StagePanel>

          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Job description</h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                Everything candidates should be able to review before deciding to apply.
              </p>
            </div>
            <JobDescriptionContent html={job.description} />
          </StagePanel>
        </div>

        <StagePanel id="apply" tone="summary" className="h-fit space-y-5 xl:sticky xl:top-6">
          <div className="space-y-2 border-b border-[color:var(--app-border)] pb-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Easy apply</p>
              <h2 className="text-2xl text-[color:var(--app-heading)]">Apply to {job.title}</h2>
            </div>
            <p className="text-sm leading-6 text-[color:var(--app-muted)]">
              Share your contact details, add a resume if you have one ready, and send everything straight to the
              hiring review queue from this page.
            </p>
          </div>

          {!hasConfirmation ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Profile</p>
                    <p className="text-xs leading-5 text-[color:var(--app-muted)]">Add your contact details.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Resume</p>
                    <p className="text-xs leading-5 text-[color:var(--app-muted)]">Attach a PDF if available.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-brand-300/20 bg-brand-400/10 p-2 text-brand-200">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Submit</p>
                    <p className="text-xs leading-5 text-[color:var(--app-muted)]">Complete the form in one place.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {pageState.applied ? (
            <div className="space-y-3 rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-base font-medium text-emerald-50">
                  <CheckCircle2 className="h-4 w-4" />
                  Application received
                </p>
                <p>
                  We saved your application for this role.
                  {pageState.resumeError ? " The resume upload did not finish, so only the application details were saved." : ""}
                </p>
              </div>
              <p className="text-sm text-emerald-50/90">If there is a fit, the team will move you forward from the same review workflow.</p>
            </div>
          ) : null}
          {pageState.alreadyApplied ? (
            <div className="space-y-2 rounded-[18px] border border-brand-300/30 bg-brand-500/10 p-5 text-sm text-[color:var(--app-heading)]">
              <p className="text-base font-medium">Application already received</p>
              <p>We already have an application for this email on this job, so we did not create a duplicate.</p>
            </div>
          ) : null}
          {pageState.error ? (
            <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
              {pageState.error}
            </div>
          ) : null}

          {!hasConfirmation ? (
            <div className="space-y-4">
              <form action={`/api/jobs/${job.slug}/apply`} method="post" encType="multipart/form-data" className="space-y-5">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Contact details</p>
                    <p className="text-sm text-[color:var(--app-muted)]">Use the details the hiring team should contact you on.</p>
                  </div>
                  <div className="grid gap-4">
                    <label className="grid gap-1.5">
                      <span className="text-sm text-[color:var(--app-text)]">Full name</span>
                      <input
                        name="fullName"
                        required
                        placeholder="Jane Doe"
                        className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-1.5">
                        <span className="text-sm text-[color:var(--app-text)]">Email</span>
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="jane@example.com"
                          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-sm text-[color:var(--app-text)]">Phone</span>
                        <input
                          name="phone"
                          placeholder="+94 77 123 4567"
                          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Resume</p>
                    <p className="text-sm text-[color:var(--app-muted)]">Upload a PDF if you want to include one with this application.</p>
                  </div>
                  <label className="grid gap-1.5">
                    <span className="text-sm text-[color:var(--app-text)]">Resume</span>
                    <input
                      name="resume"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)]"
                    />
                  </label>
                </div>

                <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">Message</p>
                    <p className="text-sm text-[color:var(--app-muted)]">Add a short note if there is anything the team should know.</p>
                  </div>
                  <label className="grid gap-1.5">
                    <span className="text-sm text-[color:var(--app-text)]">Cover note</span>
                    <textarea
                      name="coverNote"
                      rows={5}
                      placeholder="Share a short introduction, relevant experience, or anything else that helps your application."
                      className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                    />
                  </label>
                </div>

                <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                  <p className="text-xs leading-6 text-[color:var(--app-muted)]">
                    By submitting, you are sharing this information with the hiring team for review on this role.
                  </p>
                  <Button type="submit" className="w-full justify-center">
                    Apply now
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link href="/jobs">
                <Button type="button" variant="secondary">
                  Back to jobs
                </Button>
              </Link>
              <Link href="/">
                <Button type="button" variant="ghost">
                  Open Northstar
                </Button>
              </Link>
            </div>
          )}
        </StagePanel>
      </div>
    </SceneShell>
  );
}
