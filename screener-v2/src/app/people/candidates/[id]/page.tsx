import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { CandidateActivityModal } from "@/components/candidates/CandidateActivityModal";
import { CandidateMilestoneTimeline } from "@/components/candidates/CandidateMilestoneTimeline";
import { CandidateNotesModal } from "@/components/candidates/CandidateNotesModal";
import { EditCandidateInfoModal } from "@/components/candidates/EditCandidateInfoModal";
import { FinalizeActionBar } from "@/components/candidates/FinalizeActionBar";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import { TransferCandidateAction } from "@/components/candidates/TransferCandidateAction";
import { ResponsibleTeamCard } from "@/components/candidates/ResponsibleTeamCard";
import { Button } from "@/components/primitives/Button";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getCandidateStageLabel } from "@/lib/candidates/lifecycle";
import type { CandidateStage } from "@/lib/candidates/types";
import { buildCandidateActivityFeed } from "@/lib/candidates/workspace";
import { requirePageSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { getCandidateDetail } from "@/lib/db/candidates";
import { candidateApplicationStatusLabels, isActiveApplicationStatus } from "@/lib/jobs/types";
import { prisma } from "@/lib/db/prisma";
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";

export const dynamic = "force-dynamic";

type CandidateData = NonNullable<Awaited<ReturnType<typeof getCandidateDetail>>>;

function latestAssessment(candidate: CandidateData) {
  return candidate.assessments[0] ?? null;
}

function nextPrompt(candidate: CandidateData) {
  if (candidate.stage === "applicant") {
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
    title: "Assigned",
    detail: "Assessment assigned"
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
  const session = await requirePageSession(`/people/candidates/${id}`);
  const permission = await requireCandidatePermission(session, id, "view_candidates");
  if (!permission.ok) {
    if (permission.response.status === 404) {
      notFound();
    }
    redirect("/people/candidates");
  }

  const candidate = await getCandidateDetail(id);
  if (!candidate) {
    notFound();
  }

  const pageState = await searchParams;
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

  // Fetch assignments and users for the active application (or first if none active)
  const targetApplication = activeApplication || candidate.applications[0] || null;
  const [assignments, users] = targetApplication
    ? await Promise.all([
        getApplicationAssignments(targetApplication.id),
        prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" }
        })
      ])
    : [[], []];
  const outcomeBadges = (
    <div className="flex flex-wrap gap-2">
      {candidate.currentFocus ? <StatusPill label={candidate.currentFocus} tone="neutral" /> : null}
      {candidate.hrOwner ? (
        <StatusPill label={`Owner ${candidate.hrOwner}`} tone="neutral" className="normal-case tracking-normal" />
      ) : null}
      <StatusPill
        label={getCandidateStageLabel(candidate.stage as CandidateStage)}
        tone={candidate.stage === "applicant" ? "amber" : "blue"}
      />
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
        <Link href={(candidate.stage === "applicant" ? "/people/candidates/applicants" : "/people/candidates") as Route}>
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
              <h2 className="text-3xl text-[color:var(--app-heading)]">Current status</h2>
              <p className="max-w-2xl text-sm text-[color:var(--app-text)]">
                Track where things stand and what should happen next.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {candidate.stage === "applicant" && activeApplication && session.permissions.includes("promote_candidate") ? (
                <form action={`/api/candidate-applications/${activeApplication.id}`} method="post">
                  <input type="hidden" name="action" value="promote" />
                  <input type="hidden" name="returnTo" value={`/people/candidates/${candidate.id}` as Route} />
                  <Button type="submit">Move to pipeline</Button>
                </form>
              ) : null}
              {session.permissions.includes("manage_candidates") ? (
                <EditCandidateInfoModal candidate={candidate} />
              ) : null}
              {session.permissions.includes("manage_candidates") && candidate.orgStage !== "finalized" ? (
                <TransferCandidateAction candidateId={candidate.id} />
              ) : null}
              {session.permissions.includes("delete_candidate") ? (
                <form action={`/api/candidates/${candidate.id}/delete`} method="post">
                  <ConfirmSubmitButton
                    variant="secondary"
                    confirmMessage={`Delete ${candidate.fullName}? This removes the candidate and any linked lifecycle data. This is a data cleanup action and cannot be undone.`}
                  >
                    Delete record
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </div>
          </div>

          <div className="space-y-5">
            {outcomeBadges}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Email</p>
                <p className="break-all text-sm text-[color:var(--app-text)] mt-1">{candidate.email}</p>
              </div>
              <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Role</p>
                <p className="text-sm text-[color:var(--app-text)] mt-1">{candidate.roleLabel || "Role not set"}</p>
              </div>
              <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Owner</p>
                <p className="text-sm text-[color:var(--app-text)] mt-1">{candidate.hrOwner || "No owner assigned"}</p>
              </div>
              <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Pipeline stage</p>
                <p className="text-sm text-[color:var(--app-brand)] mt-1">{candidate.currentFocus || (candidate.stage === "applicant" ? "In applicant review" : "Awaiting next action")}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Assessment</p>
                <p className="text-lg text-[color:var(--app-heading)] mt-1">{latestAssessmentState.title}</p>
                <p className="text-xs text-[color:var(--app-muted)] mt-1">{latestAssessmentState.detail}</p>
                {!latestAssessment(candidate) && candidate.stage !== "applicant" && (
                  <p className="text-xs text-amber-400 mt-2">Assign when ready</p>
                )}
              </div>
              <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Resume</p>
                <p className="text-sm text-[color:var(--app-heading)] mt-1">{currentResume ? "Attached" : "Missing"}</p>
                <p className="break-all text-xs leading-5 text-[color:var(--app-muted)] mt-1">
                  {currentResume ? currentResume.fileName : "Upload to add review context"}
                </p>
              </div>
              <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Next step</p>
                <p className="text-sm text-[color:var(--app-text)] mt-1">{nextPrompt(candidate)}</p>
              </div>
            </div>

            <FinalizeActionBar
              candidateId={candidate.id}
              orgStage={candidate.orgStage}
              finalizedAs={candidate.finalizedAs}
              permissions={session.permissions}
            />
          </div>

          <div className="border-t border-[color:var(--app-border)] pt-5">
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
          </div>
        </StagePanel>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-[color:var(--app-heading)]">Pipeline activity</h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Follow candidate activity from first review to final decision.
                </p>
              </div>
              <CandidateMilestoneTimeline
                candidateId={candidate.id}
                milestones={candidate.milestones}
                hasResume={Boolean(currentResume)}
              />
            </div>
          </div>

          <div className="space-y-6">
            {targetApplication && (
              <ResponsibleTeamCard
                applicationId={targetApplication.id}
                assignments={assignments}
                users={users}
                canEdit={session.permissions.includes("manage_candidates")}
              />
            )}

            {!targetApplication && candidate.applications.length === 0 && (
              <section className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl text-[color:var(--app-heading)]">Responsible team</h2>
                  <p className="text-sm text-[color:var(--app-muted)]">Team members assigned to this candidate.</p>
                </div>
                <div className="rounded-[20px] border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <p className="font-medium">No active application</p>
                  <p className="text-xs opacity-90 mt-1">This is an imported candidate record with no linked job application yet.</p>
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Applications</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Linked job applications.</p>
              </div>

              <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                {candidate.applications.length === 0 ? (
                  <p className="text-sm text-[color:var(--app-muted)]">No applications recorded. Imported candidate — no linked application yet.</p>
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
              <CandidateActivityModal items={activityFeed} />
            </section>
          </div>
        </div>

      </div>
    </SceneShell>
  );
}
