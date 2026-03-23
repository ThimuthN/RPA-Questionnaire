import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  CandidateAssessmentPill,
  CandidateNoteTypePill,
  CandidateUiStatusPill
} from "@/components/candidates/CandidatePills";
import { CandidateMilestoneTimeline } from "@/components/candidates/CandidateMilestoneTimeline";
import { EditCandidateInfoModal } from "@/components/candidates/EditCandidateInfoModal";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { buildCandidateActivityFeed } from "@/lib/candidates/workspace";
import { candidateNoteTypeLabels, candidateNoteTypeValues, candidateUiStatusLabels, candidateUiStatusValues } from "@/lib/candidates/types";
import { getCandidateUiStatus } from "@/lib/candidates/ui-status";
import { getCandidateDetail } from "@/lib/db/candidates";

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
  if (!candidate.resumes.length) return "Resume can be added any time.";
  if (candidate.currentFocus) return `Current focus: ${candidate.currentFocus}`;
  return "Update the next milestone when the candidate moves forward.";
}

function resultTone(status: ReturnType<typeof currentAssessmentStatus>) {
  return status === "passed" ? "emerald" : status === "review" ? "amber" : status === "failed" ? "red" : "neutral";
}

function HiddenCandidateFields({ candidate }: { candidate: CandidateData }) {
  return (
    <>
      <input type="hidden" name="fullName" value={candidate.fullName} />
      <input type="hidden" name="email" value={candidate.email} />
      <input type="hidden" name="phone" value={candidate.phone || ""} />
      <input type="hidden" name="positionAppliedFor" value={candidate.positionAppliedFor || ""} />
      <input type="hidden" name="batchId" value={candidate.batchId || ""} />
      <input type="hidden" name="resumeSource" value={candidate.resumeSource || ""} />
      <input type="hidden" name="hrOwner" value={candidate.hrOwner || ""} />
      <input type="hidden" name="candidateFolderUrl" value={candidate.candidateFolderUrl || ""} />
    </>
  );
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
  const candidate = await getCandidateDetail(id);
  if (!candidate) {
    notFound();
  }

  const pageState = await searchParams;
  const uiStatus = currentUiStatus(candidate);
  const screener = currentAssessmentStatus(candidate);
  const latest = latestAssessment(candidate);
  const currentResume = candidate.resumes[0] ?? null;
  const resumePreviewUrl = currentResume
    ? `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(currentResume.storageKey)}`
    : null;
  const resumeDownloadUrl = currentResume
    ? `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(currentResume.storageKey)}&download=1`
    : null;
  const screenerMilestone = candidate.milestones.find((milestone) => milestone.type === "screener");
  const canSendScreener = Boolean(
    screenerMilestone && screenerMilestone.mode === "platform" && !screenerMilestone.assessment
  );
  const activityFeed = buildCandidateActivityFeed(candidate).slice(0, 8);

  return (
    <SceneShell
      variant="results"
      eyebrow="Candidate"
      title={candidate.fullName}
      subtitle={candidate.positionAppliedFor || candidate.email}
      utility={
        <div className="flex flex-wrap gap-2">
          <CandidateUiStatusPill status={uiStatus} />
          <CandidateAssessmentPill status={screener} />
          <Link href={"/candidates" as Route}>
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {(pageState.created || pageState.updated || pageState.noteAdded || pageState.resumeUploaded || pageState.error) ? (
          <StagePanel className="space-y-2">
            {pageState.created || pageState.updated ? <p className="text-sm text-emerald-200">Candidate saved.</p> : null}
            {pageState.noteAdded ? <p className="text-sm text-emerald-200">Note added.</p> : null}
            {pageState.resumeUploaded ? <p className="text-sm text-emerald-200">Resume uploaded.</p> : null}
            {pageState.error ? <p className="text-sm text-red-200">{pageState.error}</p> : null}
          </StagePanel>
        ) : null}

        <StagePanel className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <CandidateUiStatusPill status={uiStatus} />
                <CandidateAssessmentPill status={screener} />
                {candidate.currentFocus ? <StatusPill label={candidate.currentFocus} tone="neutral" /> : null}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-300">{candidate.email}</p>
                <p className="text-sm text-slate-300">{candidate.positionAppliedFor || "Role not set"}</p>
                <p className="text-sm text-slate-400">{candidate.hrOwner ? `Owner: ${candidate.hrOwner}` : "No owner"}</p>
                <p className="text-sm text-brand-100">{nextPrompt(candidate)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!currentResume ? (
                <a href="#resume">
                  <Button>Add resume</Button>
                </a>
              ) : null}

              {canSendScreener && screenerMilestone ? (
                <Link href={`/create-test?candidateId=${candidate.id}&milestoneId=${screenerMilestone.id}` as Route}>
                  <Button>Send screener</Button>
                </Link>
              ) : null}

              {latest?.attemptId && typeof latest.finalPercent === "number" ? (
                <Link href={`/results/${latest.attemptId}` as Route}>
                  <Button variant="secondary">View result</Button>
                </Link>
              ) : null}

              <EditCandidateInfoModal candidate={candidate} uiStatus={uiStatus} />
              <form action={`/api/candidates/${candidate.id}/delete`} method="post">
                <ConfirmSubmitButton
                  variant="danger"
                  confirmMessage={`Delete ${candidate.fullName}? This removes the candidate and any linked screener data.`}
                >
                  Delete candidate
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <form action={`/api/candidates/${candidate.id}`} method="post" className="space-y-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
            <HiddenCandidateFields candidate={candidate} />
            <div className="space-y-1">
              <h2 className="text-lg text-white">Outcome</h2>
              <p className="text-sm text-slate-300">Pin the current decision summary here so reviewers see it before diving into the full timeline.</p>
            </div>
            <ChoicePills
              name="uiStatus"
              idPrefix={`candidate-status-${candidate.id}`}
              defaultValue={uiStatus}
              options={candidateUiStatusValues.map((status) => ({
                value: status,
                label: candidateUiStatusLabels[status]
              }))}
            />
            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Decision summary</span>
              <textarea
                name="notesSummary"
                rows={3}
                defaultValue={candidate.notesSummary || ""}
                placeholder="Summarize the decision, strongest signal, and next step."
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>
            <div className="flex justify-end">
              <Button type="submit">Save outcome</Button>
            </div>
          </form>
        </StagePanel>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <StagePanel className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Journey</h2>
                <p className="text-sm text-slate-300">Use this as the working path for the candidate, not just a checklist.</p>
              </div>
              <CandidateMilestoneTimeline
                candidateId={candidate.id}
                milestones={candidate.milestones}
                hasResume={Boolean(currentResume)}
              />
            </StagePanel>

            <StagePanel className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Recent activity</h2>
                <p className="text-sm text-slate-300">Resume, notes, result events, and milestone changes in one feed.</p>
              </div>
              {activityFeed.length === 0 ? (
                <p className="text-sm text-slate-300">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={item.kind} tone="neutral" />
                        <StatusPill label={new Date(item.at).toLocaleString()} tone="neutral" />
                      </div>
                      <p className="mt-3 text-sm text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </StagePanel>
          </div>

          <div className="space-y-5">
            <StagePanel className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Latest result</h2>
                <p className="text-sm text-slate-300">Keep score, status, and reviewer direction visible alongside the candidate profile.</p>
              </div>
              {latest?.attemptId ? (
                <div className="space-y-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap gap-2">
                    <CandidateAssessmentPill status={screener} />
                    <StatusPill label={latest.finalPercent ? `${latest.finalPercent.toFixed(1)} / 100` : "Awaiting score"} tone="blue" />
                    <StatusPill label={screener.replace("_", " ")} tone={resultTone(screener)} />
                  </div>
                  <p className="text-sm text-slate-300">
                    {latest.submittedAt
                      ? `Submitted ${new Date(latest.submittedAt).toLocaleString()}`
                      : latest.startedAt
                        ? `In progress since ${new Date(latest.startedAt).toLocaleString()}`
                        : `Linked on ${new Date(latest.createdAt).toLocaleString()}`}
                  </p>
                  {candidate.notesSummary ? <p className="text-sm text-brand-100">{candidate.notesSummary}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/results/${latest.attemptId}` as Route}>
                      <Button variant="secondary">Open result</Button>
                    </Link>
                    {canSendScreener && screenerMilestone ? (
                      <Link href={`/create-test?candidateId=${candidate.id}&milestoneId=${screenerMilestone.id}` as Route}>
                        <Button>Send another screener</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-slate-300">No screener result yet.</p>
                  {canSendScreener && screenerMilestone ? (
                    <Link href={`/create-test?candidateId=${candidate.id}&milestoneId=${screenerMilestone.id}` as Route}>
                      <Button className="mt-3">Send screener</Button>
                    </Link>
                  ) : null}
                </div>
              )}
            </StagePanel>

            <StagePanel id="resume" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Resume</h2>
                <p className="text-sm text-slate-300">{currentResume ? "Current resume is attached below." : "No resume yet."}</p>
              </div>

              <ResumeUploader candidateId={candidate.id} hasResume={Boolean(currentResume)} />

              {currentResume ? (
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label="Current" tone="blue" />
                          <StatusPill label="PDF" tone="neutral" />
                        </div>
                        <p className="text-sm text-white">{currentResume.fileName}</p>
                        <p className="text-xs text-slate-400">
                          {Math.max(1, Math.round(currentResume.sizeBytes / 1024))} KB | Uploaded{" "}
                          {new Date(currentResume.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <a href={resumeDownloadUrl ?? "#"} target="_blank" rel="noreferrer">
                        <Button type="button" variant="secondary">
                          {currentResume.mimeType === "application/pdf" ? "Open full size" : "Download"}
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white">
                    <object
                      data={resumePreviewUrl ?? undefined}
                      type="application/pdf"
                      className="h-[640px] w-full"
                    >
                      <div className="flex h-[320px] items-center justify-center bg-slate-50 px-6 text-center">
                        <div className="space-y-3">
                          <p className="text-sm text-slate-700">Preview is not available in this browser.</p>
                          <a href={resumePreviewUrl ?? "#"} target="_blank" rel="noreferrer">
                            <Button type="button" variant="secondary">
                              Open PDF
                            </Button>
                          </a>
                        </div>
                      </div>
                    </object>
                  </div>
                </div>
              ) : null}
            </StagePanel>

            <StagePanel className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Notes</h2>
                <p className="text-sm text-slate-300">Keep interview notes, strengths, and concerns here.</p>
              </div>

              <form action={`/api/candidates/${candidate.id}/notes`} method="post" className="space-y-4">
                <div className="grid gap-2">
                  <span className="text-sm text-slate-200">Type</span>
                  <ChoicePills
                    name="type"
                    idPrefix="candidate-note-type"
                    defaultValue="general"
                    required
                    options={candidateNoteTypeValues.map((value) => ({
                      value,
                      label: candidateNoteTypeLabels[value]
                    }))}
                  />
                </div>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Note</span>
                  <textarea
                    name="body"
                    rows={4}
                    required
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>

                <Button type="submit">Add note</Button>
              </form>

              {candidate.notes.length === 0 ? (
                <p className="text-sm text-slate-300">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {candidate.notes.map((note) => {
                    const author = note.createdByName || note.createdByEmail;

                    return (
                      <div key={note.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap gap-2">
                          <CandidateNoteTypePill type={note.type} />
                          <StatusPill label={new Date(note.createdAt).toLocaleString()} tone="neutral" />
                          {author ? <StatusPill label={`by ${author}`} tone="neutral" className="normal-case tracking-normal" /> : null}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{note.body}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </StagePanel>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}
