import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { getApplicantReviewDetail } from "@/lib/db/jobs";
import { candidateApplicationStatusLabels } from "@/lib/jobs/types";

function applicationTone(status: string): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  if (status === "closed") return "blue";
  return "neutral";
}

function NoticeBanner({
  tone,
  children
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const className =
    tone === "success"
      ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
      : "rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100";

  return <div className={className}>{children}</div>;
}

export default async function ApplicantReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  await requirePageSession(`/people/candidates/applicants/${id}`);
  const pageState = await searchParams;
  const detail = await getApplicantReviewDetail(id);

  if (!detail) {
    notFound();
  }

  const previewUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}`
    : null;
  const downloadUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}&download=1`
    : null;
  const returnTo = `/people/candidates/applicants/${detail.id}` as Route;

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="People"
      title={detail.candidate.fullName}
      subtitle={detail.job.title}
      utility={
        <div className="flex flex-wrap items-center gap-2">
          <PeopleViewSwitch current="candidates" />
          <Link href="/people/candidates/applicants">
            <Button variant="secondary">Back to applicants</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <CandidatesViewSwitch current="applicants" />

        {pageState.updated ? <NoticeBanner tone="success">Review updated.</NoticeBanner> : null}
        {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}

        <StagePanel className="space-y-5 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Applicant review</p>
              <h2 className="text-3xl text-[color:var(--app-heading)]">Review this application</h2>
              <p className="max-w-2xl text-sm text-[color:var(--app-text)]">
                Keep the application context here, then move the person into the pipeline only when you are ready.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={candidateApplicationStatusLabels[detail.status]}
                tone={applicationTone(detail.status)}
              />
              <StatusPill label={detail.candidate.intakeBucket === "applicant" ? "Applicant" : "Pipeline"} tone="blue" />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="grid gap-4 border-t border-[color:var(--app-border)] pt-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Email</p>
                  <p className="break-all text-sm text-[color:var(--app-text)]">{detail.candidate.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Phone</p>
                  <p className="text-sm text-[color:var(--app-text)]">{detail.candidate.phone || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Owner</p>
                  <p className="text-sm text-[color:var(--app-text)]">{detail.candidate.hrOwner || "Unassigned"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Applied for</p>
                  <p className="text-sm text-[color:var(--app-text)]">{detail.job.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Applied on</p>
                  <p className="text-sm text-[color:var(--app-text)]">{new Date(detail.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Resume</p>
                  <p className="text-sm text-[color:var(--app-text)]">{detail.latestResume ? "Attached" : "Missing"}</p>
                </div>
              </div>

              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Application note</p>
                  <p className="text-sm leading-6 text-[color:var(--app-text)]">
                    {detail.applicationNote || "No note was added with this application."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-[color:var(--app-border)] pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Decision actions</p>
                <h3 className="text-xl text-[color:var(--app-heading)]">Decide the next step</h3>
                <p className="text-sm text-[color:var(--app-muted)]">Set an owner, then keep them in review, move them into the pipeline, or close the application.</p>
              </div>

              <form action={`/api/candidate-applications/${detail.id}`} method="post" className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <input type="hidden" name="action" value="review" />
                <input type="hidden" name="returnTo" value={returnTo} />
                <label className="grid gap-1">
                  <span className="text-sm text-[color:var(--app-text)]">Owner</span>
                  <input
                    name="hrOwner"
                    defaultValue={detail.candidate.hrOwner || ""}
                    placeholder="Assign an owner"
                    className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>
                <Button type="submit" variant="secondary">Mark under review</Button>
              </form>

              <form action={`/api/candidate-applications/${detail.id}`} method="post" className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <input type="hidden" name="action" value="promote" />
                <input type="hidden" name="returnTo" value={`/candidates/${detail.candidate.id}` as Route} />
                <label className="grid gap-1">
                  <span className="text-sm text-[color:var(--app-text)]">Owner</span>
                  <input
                    name="hrOwner"
                    defaultValue={detail.candidate.hrOwner || ""}
                    placeholder="Assign an owner"
                    className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>
                <Button type="submit">Move to pipeline</Button>
              </form>

              <form action={`/api/candidate-applications/${detail.id}`} method="post" className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <input type="hidden" name="action" value="close" />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Button type="submit" variant="secondary">Close application</Button>
              </form>

              <div className="flex flex-wrap gap-2">
                <Link href={`/candidates/${detail.candidate.id}` as Route}>
                  <Button type="button" variant="ghost">Open candidate profile</Button>
                </Link>
              </div>
            </div>
          </div>
        </StagePanel>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Job context</h2>
              <p className="text-sm text-[color:var(--app-muted)]">Keep the role details close while you review.</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-[color:var(--app-muted)]">{detail.job.summary}</p>
              <div className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--app-text)]">{detail.job.description}</div>
            </div>
          </StagePanel>

          <div className="space-y-4">
            <StagePanel tone="summary" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Resume</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Open the applicant resume from here.</p>
              </div>
              {detail.latestResume ? (
                <>
                  <p className="text-sm text-[color:var(--app-heading)]">{detail.latestResume.fileName}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">
                    {Math.max(1, Math.round(detail.latestResume.sizeBytes / 1024))} KB | Uploaded{" "}
                    {new Date(detail.latestResume.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {previewUrl ? (
                      <ResumePreviewModal
                        fileName={detail.latestResume.fileName}
                        previewUrl={previewUrl}
                        downloadUrl={downloadUrl}
                      />
                    ) : null}
                    <a href={downloadUrl ?? "#"} target="_blank" rel="noreferrer">
                      <Button type="button" variant="secondary">
                        Download PDF
                      </Button>
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[color:var(--app-muted)]">No resume uploaded with this application.</p>
              )}
            </StagePanel>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}
