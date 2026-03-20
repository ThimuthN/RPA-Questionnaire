import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  CandidateAssessmentPill,
  CandidateNoteTypePill,
  CandidateUiStatusPill
} from "@/components/candidates/CandidatePills";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import {
  candidateNoteTypeLabels,
  candidateNoteTypeValues,
  resumeSourceOptions
} from "@/lib/candidates/types";
import { getCandidateUiStatus } from "@/lib/candidates/ui-status";
import { getCandidateDetail } from "@/lib/db/candidates";
import { StatusPill } from "@/components/primitives/StatusPill";

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

function canSendTest(candidate: CandidateData) {
  return candidate.resumes.length > 0 && currentAssessmentStatus(candidate) === "none";
}

function nextStepText(candidate: CandidateData) {
  const uiStatus = currentUiStatus(candidate);
  const screener = currentAssessmentStatus(candidate);

  if (!candidate.resumes.length) return "Add the resume first.";
  if (uiStatus === "moved_forward") return "Candidate has moved forward.";
  if (uiStatus === "rejected") return "Candidate has been rejected.";
  if (screener === "none") return "Send the screener when you're ready.";
  if (screener === "invited") return "Waiting for the candidate to start the screener.";
  if (screener === "in_progress") return "Waiting for the screener submission.";
  return "Review the screener result and decide what to do next.";
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

function QuickActionForm({
  candidate,
  label,
  status,
  variant = "secondary"
}: {
  candidate: CandidateData;
  label: string;
  status: "moved_forward" | "rejected";
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <form action={`/api/candidates/${candidate.id}`} method="post">
      <HiddenCandidateFields candidate={candidate} />
      <input type="hidden" name="uiStatus" value={status} />
      <Button type="submit" variant={variant}>
        {label}
      </Button>
    </form>
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

        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">What&apos;s next</h2>
            <p className="text-sm text-slate-300">{nextStepText(candidate)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!currentResume ? (
              <a href="#resume">
                <Button>Add resume</Button>
              </a>
            ) : null}

            {canSendTest(candidate) ? (
              <Link href={`/create-test?candidateId=${candidate.id}` as Route}>
                <Button>Send screener</Button>
              </Link>
            ) : null}

            {latest?.attemptId && typeof latest.finalPercent === "number" ? (
              <Link href={`/results/${latest.attemptId}` as Route}>
                <Button variant="secondary">View result</Button>
              </Link>
            ) : null}

            {uiStatus === "need_review" ? (
              <>
                <QuickActionForm
                  candidate={candidate}
                  label="Move forward"
                  status="moved_forward"
                  variant="primary"
                />
                <QuickActionForm
                  candidate={candidate}
                  label="Reject"
                  status="rejected"
                  variant="danger"
                />
              </>
            ) : null}
          </div>
        </StagePanel>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <StagePanel className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Candidate</h2>
                <p className="text-sm text-slate-300">{candidate.email}</p>
              </div>

              <details className="group">
                <summary className="list-none">
                  <span className="inline-flex cursor-pointer rounded-full border border-white/16 bg-white/[0.05] px-3 py-2 text-sm text-slate-100 transition hover:border-white/30 hover:bg-white/[0.08]">
                    Edit info
                  </span>
                </summary>

                <form action={`/api/candidates/${candidate.id}`} method="post" className="mt-4 space-y-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <input type="hidden" name="stage" value={candidate.stage} />
                  <input type="hidden" name="finalDecision" value={candidate.finalDecision} />
                  <input type="hidden" name="nextAction" value={candidate.nextAction} />
                  <input type="hidden" name="screeningStatus" value={candidate.screeningStatus || ""} />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Full name</span>
                      <input
                        name="fullName"
                        defaultValue={candidate.fullName}
                        required
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Email</span>
                      <input
                        name="email"
                        type="email"
                        defaultValue={candidate.email}
                        required
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Role</span>
                      <input
                        name="positionAppliedFor"
                        defaultValue={candidate.positionAppliedFor || ""}
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Owner</span>
                      <input
                        name="hrOwner"
                        defaultValue={candidate.hrOwner || ""}
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>
                  </div>

                  <input type="hidden" name="phone" value={candidate.phone || ""} />
                  <input type="hidden" name="batchId" value={candidate.batchId || ""} />

                  <div className="grid gap-2">
                    <span className="text-sm text-slate-200">Source</span>
                    <ChoicePills
                      name="resumeSource"
                      idPrefix="candidate-source"
                      defaultValue={candidate.resumeSource || ""}
                      options={[
                        { value: "", label: "Skip" },
                        ...resumeSourceOptions.map((option) => ({ value: option, label: option }))
                      ]}
                    />
                  </div>

                  <label className="grid gap-1">
                    <span className="text-sm text-slate-200">Folder link</span>
                    <input
                      name="candidateFolderUrl"
                      defaultValue={candidate.candidateFolderUrl || ""}
                      placeholder="https://..."
                      className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                    />
                  </label>

                  <Button type="submit">Save info</Button>
                </form>
              </details>
            </div>

            <div className="space-y-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap gap-2">
                <CandidateUiStatusPill status={uiStatus} />
                <CandidateAssessmentPill status={screener} />
              </div>
              <p className="text-sm text-slate-200">{candidate.positionAppliedFor || "Role not set"}</p>
              <p className="text-sm text-slate-400">{candidate.hrOwner ? `Owner: ${candidate.hrOwner}` : "No owner"}</p>
              {candidate.resumeSource ? <p className="text-sm text-slate-400">Source: {candidate.resumeSource}</p> : null}
              {candidate.candidateFolderUrl ? (
                <a
                  href={candidate.candidateFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-brand-100 underline-offset-4 hover:underline"
                >
                  Open folder
                </a>
              ) : null}
            </div>
          </StagePanel>

          <StagePanel id="resume" className="space-y-4">
            <h2 className="text-2xl text-white">Resume</h2>

            <ResumeUploader candidateId={candidate.id} hasResume={Boolean(currentResume)} />

            {currentResume ? (
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label="Current" tone="blue" />
                      <StatusPill
                        label={currentResume.mimeType === "application/pdf" ? "PDF" : "DOCX"}
                        tone="neutral"
                      />
                    </div>
                    <p className="text-sm text-white">{currentResume.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {Math.max(1, Math.round(currentResume.sizeBytes / 1024))} KB | Uploaded{" "}
                      {new Date(currentResume.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <a href={currentResume.storageUrl} target="_blank" rel="noreferrer">
                    <Button type="button" variant="secondary">
                      {currentResume.mimeType === "application/pdf" ? "View" : "Download"}
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-300">No resume yet.</p>
            )}
          </StagePanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <StagePanel className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl text-white">Screener</h2>
              {canSendTest(candidate) ? (
                <Link href={`/create-test?candidateId=${candidate.id}` as Route}>
                  <Button>Send screener</Button>
                </Link>
              ) : null}
            </div>

            {candidate.assessments.length === 0 ? (
              <p className="text-sm text-slate-300">No screener sent yet.</p>
            ) : (
              <div className="space-y-3">
                {candidate.assessments.map((assessment) => (
                  <div key={assessment.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <CandidateAssessmentPill status={assessment.status} />
                          <StatusPill label={`Test ${assessment.inviteSlug.toUpperCase()}`} tone="neutral" />
                        </div>
                        <p className="text-sm text-slate-300">
                          Sent {new Date(assessment.createdAt).toLocaleString()}
                        </p>
                        {assessment.startedAt ? (
                          <p className="text-xs text-slate-400">
                            Started {new Date(assessment.startedAt).toLocaleString()}
                            {assessment.submittedAt
                              ? ` | Submitted ${new Date(assessment.submittedAt).toLocaleString()}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {typeof assessment.finalPercent === "number" ? (
                          <StatusPill label={`${assessment.finalPercent.toFixed(1)} / 100`} tone="blue" />
                        ) : null}
                        {assessment.attemptId && typeof assessment.finalPercent === "number" ? (
                          <Link href={`/results/${assessment.attemptId}` as Route}>
                            <Button variant="secondary">View result</Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StagePanel>

          <StagePanel className="space-y-5">
            <h2 className="text-2xl text-white">Notes</h2>

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
                {candidate.notes.map((note) => (
                  <div key={note.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap gap-2">
                      <CandidateNoteTypePill type={note.type} />
                      <StatusPill label={new Date(note.createdAt).toLocaleString()} tone="neutral" />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{note.body}</p>
                  </div>
                ))}
              </div>
            )}
          </StagePanel>
        </div>
      </div>
    </SceneShell>
  );
}
