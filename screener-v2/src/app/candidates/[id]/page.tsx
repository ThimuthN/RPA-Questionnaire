import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { CandidateUiStatusPill } from "@/components/candidates/CandidatePills";
import { CandidateActivityModal } from "@/components/candidates/CandidateActivityModal";
import { CandidateMilestoneTimeline } from "@/components/candidates/CandidateMilestoneTimeline";
import { CandidateNotesModal } from "@/components/candidates/CandidateNotesModal";
import { EditCandidateInfoModal } from "@/components/candidates/EditCandidateInfoModal";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import { Button } from "@/components/primitives/Button";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { buildCandidateActivityFeed } from "@/lib/candidates/workspace";
import { getCandidateUiStatus } from "@/lib/candidates/ui-status";
import { requirePageSession } from "@/lib/auth/guards";
import { getCandidateDetail } from "@/lib/db/candidates";
import { candidateApplicationStatusLabels, isActiveApplicationStatus } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

type CandidateData = NonNullable<Awaited<ReturnType<typeof getCandidateDetail>>>;

function latestAssessment(candidate: CandidateData) {
  return candidate.assessments[0] ?? null;
}

function currentAssessmentStatus(candidate: CandidateData) {
  return latestAssessment(candidate)?.status ?? "none";
}

function currentUiStatus(candidate: CandidateData) {
  return getCandidateUiStatus({
    stage: candidate.stage,
    finalDecision: candidate.finalDecision,
    nextAction: candidate.nextAction,
    screeningStatus: candidate.screeningStatus,
    latestAssessmentStatus: currentAssessmentStatus(candidate)
  });
}

function nextPrompt(candidate: CandidateData) {
  if (candidate.intakeBucket === "applicant") {
    return "Review the application and move them into the pipeline when you're ready.";
  }
  if (!candidate.resumes.length) return "Add a resume if you need one for review.";
  if (candidate.currentFocus) return candidate.currentFocus;
  return "Set the next stage when you're ready.";
}

function primaryApplication(candidate: CandidateData) {
  return candidate.applications.find((application) => isActiveApplicationStatus(application.status)) ?? candidate.applications[0] ?? null;
}

function applicationTone(status: string): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  if (status === "closed") return "blue";
  return "neutral";
}

function latestAssessmentSummary(candidate: CandidateData) {
  const latest = latestAssessment(candidate);
  if (!latest) {
    return {
      title: "No assessment yet",
      detail: "No exam linked."
    };
  }

  if (typeof latest.finalPercent === "number") {
    return {
      title: `${latest.finalPercent.toFixed(1)} / 100`,
      detail: latest.submittedAt ? `Completed ${compactDate(latest.submittedAt)}` : "Assessment completed"
    };
  }

  if (latest.submittedAt) {
    return {
      title: "Submitted",
      detail: `Completed ${compactDate(latest.submittedAt)}`
    };
  }

  if (latest.startedAt) {
    return {
      title: "In progress",
      detail: `Started ${compactDate(latest.startedAt)}`
    };
  }

  return {
    title: "Sent",
    detail: "Assessment sent"
  };
}

function compactDate(value?: string | Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString();
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

export default async function CandidateDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    noteAdded?: string;
    resumeUploaded?: string;
    error?: string;
  }>;
}) {
  const { id } = await params;
  await requirePageSession(`/candidates/${id}`);
  const candidate = await getCandidateDetail(id);
  if (!candidate) {
    notFound();
  }

  const pageState = await searchParams;
  const uiStatus = currentUiStatus(candidate);
  const latest = latestAssessment(candidate);
  const activeApplication = primaryApplication(candidate);
  const currentResume = candidate.resumes[0] ?? null;
  const latestAssessmentState = latestAssessmentSummary(candidate);
  const resumePreviewUrl = currentResume
    ? `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(currentResume.storageKey)}`
    : null;
  const resumeDownloadUrl = currentResume
    ? `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(currentResume.storageKey)}&download=1`
    : null;
  const activityFeed = buildCandidateActivityFeed(candidate);
  const outcomeBadges = (
    <div className="flex flex-wrap gap-2">
      <CandidateUiStatusPill status={uiStatus} />
      {candidate.currentFocus ? <StatusPill label={candidate.currentFocus} tone="neutral" /> : null}
      {candidate.hrOwner ? (
        <StatusPill label={`Owner ${candidate.hrOwner}`} tone="neutral" className="normal-case tracking-normal" />
      ) : null}
      <StatusPill label={candidate.intakeBucket === "applicant" ? "Applicant" : "Pipeline"} tone={candidate.intakeBucket === "applicant" ? "amber" : "blue"} />
      <StatusPill label={currentResume ? "Resume attached" : "Resume missing"} tone={currentResume ? "emerald" : "amber"} />
    </div>
  );

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Candidate"
      title={candidate.fullName}
      subtitle={candidate.roleLabel || candidate.email}
      utility={
        <Link href={(candidate.intakeBucket === "applicant" ? "/people/candidates/applicants" : "/candidates") as Route}>
          <Button variant="secondary">Back to candidates</Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {pageState.created || pageState.updated || pageState.noteAdded || pageState.resumeUploaded || pageState.error ? (
          <div className="space-y-2">
            {pageState.created || pageState.updated ? <NoticeBanner tone="success">Candidate saved.</NoticeBanner> : null}
            {pageState.noteAdded ? <NoticeBanner tone="success">Note added.</NoticeBanner> : null}
            {pageState.resumeUploaded ? <NoticeBanner tone="success">Resume uploaded.</NoticeBanner> : null}
            {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}
          </div>
        ) : null}

        <StagePanel className="space-y-5 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Candidate lifecycle</p>
              <h2 className="text-3xl text-[color:var(--app-heading)]">Current decision</h2>
              <p className="max-w-2xl text-sm text-[color:var(--app-text)]">
                Track where things stand and what should happen next.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {candidate.intakeBucket === "applicant" && activeApplication ? (
                <form action={`/api/candidate-applications/${activeApplication.id}`} method="post">
                  <input type="hidden" name="action" value="promote" />
                  <input type="hidden" name="returnTo" value={`/candidates/${candidate.id}` as Route} />
                  <Button type="submit">Move to pipeline</Button>
                </form>
              ) : null}
              <EditCandidateInfoModal candidate={candidate} uiStatus={uiStatus} />
              <form action={`/api/candidates/${candidate.id}/delete`} method="post">
                <ConfirmSubmitButton
                  variant="danger"
                  confirmMessage={`Delete ${candidate.fullName}? This removes the candidate and any linked lifecycle data.`}
                >
                  Delete candidate
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="min-w-0 space-y-4">
              {outcomeBadges}

              <div className="grid gap-4 border-t border-[color:var(--app-border)] pt-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Email</p>
                  <p className="break-all text-sm text-[color:var(--app-text)]">{candidate.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Role</p>
                  <p className="text-sm text-[color:var(--app-text)]">{candidate.roleLabel || "Role not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Owner</p>
                  <p className="text-sm text-[color:var(--app-text)]">{candidate.hrOwner || "No owner assigned"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Current stage</p>
                  <p className="text-sm text-[color:var(--app-brand)]">{candidate.currentFocus || "No active stage yet"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Latest assessment</p>
                  <p className="text-lg text-[color:var(--app-heading)]">{latestAssessmentState.title}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">{latestAssessmentState.detail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Resume</p>
                  <p className="text-sm text-[color:var(--app-heading)]">{currentResume ? "Attached" : "Missing"}</p>
                  <p className="break-all text-xs leading-5 text-[color:var(--app-muted)]">
                    {currentResume ? currentResume.fileName : "Upload to add review context"}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2 xl:col-span-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Next step</p>
                  <p className="text-sm text-[color:var(--app-text)]">{nextPrompt(candidate)}</p>
                </div>
              </div>
            </div>
          </div>
        </StagePanel>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-[color:var(--app-heading)]">Candidate journey</h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Follow the process from first review to final decision.
                </p>
              </div>
              <CandidateMilestoneTimeline
                candidateId={candidate.id}
                milestones={candidate.milestones}
                hasResume={Boolean(currentResume)}
              />
            </div>
          </div>

          <div className="space-y-6 xl:pt-1">
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Applications</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Keep the linked job history here.</p>
              </div>

              <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                {candidate.applications.length === 0 ? (
                  <p className="text-sm text-[color:var(--app-muted)]">No job applications recorded yet.</p>
                ) : (
                  candidate.applications.map((application) => (
                    <div
                      key={application.id}
                      className="space-y-2 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          label={candidateApplicationStatusLabels[application.status]}
                          tone={applicationTone(application.status)}
                        />
                        <StatusPill
                          label={new Date(application.createdAt).toLocaleDateString()}
                          tone="neutral"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-[color:var(--app-heading)]">{application.jobTitle}</p>
                        <p className="text-xs text-[color:var(--app-muted)]">
                          {application.roleLabel || "No role linked"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section id="resume" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Resume</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Keep the latest resume here.</p>
              </div>

              <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                {currentResume ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label="Current" tone="blue" />
                      <StatusPill label="PDF" tone="neutral" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">{currentResume.fileName}</p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        {Math.max(1, Math.round(currentResume.sizeBytes / 1024))} KB | Uploaded{" "}
                        {new Date(currentResume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resumePreviewUrl ? (
                        <ResumePreviewModal
                          fileName={currentResume.fileName}
                          previewUrl={resumePreviewUrl}
                          downloadUrl={resumeDownloadUrl}
                        />
                      ) : null}
                      <a href={resumeDownloadUrl ?? "#"} target="_blank" rel="noreferrer">
                        <Button type="button" variant="secondary">
                          Download PDF
                        </Button>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--app-heading)]">No resume yet</p>
                    <p className="text-sm text-[color:var(--app-muted)]">Upload one when you need it.</p>
                  </div>
                )}

                <details open={!currentResume} className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--app-heading)] [&::-webkit-details-marker]:hidden">
                    {currentResume ? "Replace resume" : "Upload resume"}
                  </summary>
                  <div className="mt-4 border-t border-[color:var(--app-border)] pt-4">
                    <ResumeUploader candidateId={candidate.id} hasResume={Boolean(currentResume)} />
                  </div>
                </details>
              </div>
            </section>

            <section className="border-t border-[color:var(--app-border)] pt-5">
              <CandidateNotesModal
                candidateId={candidate.id}
                notes={candidate.notes.map((note) => ({
                  id: note.id,
                  type: note.type,
                  body: note.body,
                  createdAt: note.createdAt,
                  author: note.createdByName || note.createdByEmail
                }))}
              />
            </section>

            <section className="border-t border-[color:var(--app-border)] pt-5">
              <CandidateActivityModal items={activityFeed} />
            </section>
          </div>
        </div>

      </div>
    </SceneShell>
  );
}
