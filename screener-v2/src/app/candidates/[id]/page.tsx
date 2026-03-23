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
      <input type="hidden" name="notesSummary" value={candidate.notesSummary || ""} />
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
  const screenerMilestone = candidate.milestones.find((milestone) => milestone.type === "screener");
  const canSendScreener = Boolean(
    screenerMilestone && screenerMilestone.mode === "platform" && !screenerMilestone.assessment
  );

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
              <p className="text-sm text-slate-300">This is the overall candidate decision on this screen.</p>
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
            <div className="flex justify-end">
              <Button type="submit">Save outcome</Button>
            </div>
          </form>
        </StagePanel>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl text-white">Journey</h2>
              <p className="text-sm text-slate-300">Use this as a suggested path, not a strict checklist.</p>
            </div>
            <CandidateMilestoneTimeline
              candidateId={candidate.id}
              milestones={candidate.milestones}
              hasResume={Boolean(currentResume)}
            />
          </StagePanel>

          <div className="space-y-5">
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
                      <a href={currentResume.storageUrl} target="_blank" rel="noreferrer">
                        <Button type="button" variant="secondary">
                          {currentResume.mimeType === "application/pdf" ? "Open full size" : "Download"}
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white">
                    <object
                      data={currentResume.storageUrl}
                      type="application/pdf"
                      className="h-[640px] w-full"
                    >
                      <div className="flex h-[320px] items-center justify-center bg-slate-50 px-6 text-center">
                        <div className="space-y-3">
                          <p className="text-sm text-slate-700">Preview is not available in this browser.</p>
                          <a href={currentResume.storageUrl} target="_blank" rel="noreferrer">
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
