import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  CandidateAssessmentPill,
  CandidateDecisionPill,
  CandidateNoteTypePill,
  CandidateScreeningPill,
  CandidateStagePill
} from "@/components/candidates/CandidatePills";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import {
  candidateFinalDecisionLabels,
  candidateFinalDecisionValues,
  candidateNextActionLabels,
  candidateNextActionValues,
  candidateNoteTypeLabels,
  candidateNoteTypeValues,
  candidateScreeningStatusLabels,
  candidateScreeningStatusValues,
  candidateStageLabels,
  candidateStageValues,
  type CandidateAssessmentStatus,
  resumeSourceOptions
} from "@/lib/candidates/types";
import { getCandidateDetail } from "@/lib/db/candidates";
import { StatusPill } from "@/components/primitives/StatusPill";

export const dynamic = "force-dynamic";

function currentAssessmentStatus(candidate: NonNullable<Awaited<ReturnType<typeof getCandidateDetail>>>) {
  return candidate.assessments[0]?.status ?? "none";
}

function recommendationForCandidate(candidate: NonNullable<Awaited<ReturnType<typeof getCandidateDetail>>>) {
  const assessmentStatus = currentAssessmentStatus(candidate);
  if (assessmentStatus === "passed" || assessmentStatus === "review" || assessmentStatus === "failed") {
    return "Assessment is complete. Review the result and decide whether to move forward.";
  }
  if (assessmentStatus === "in_progress") {
    return "Candidate is taking the assessment. No action needed until submission.";
  }
  if (assessmentStatus === "invited") {
    return "Assessment has already been sent. Follow up if the candidate has not started yet.";
  }
  if (!candidate.resumes.length) {
    return "Upload the resume first, then send the assessment when you are ready.";
  }
  if (candidate.screeningStatus !== "passed") {
    return "Finish screening, then create the test from this page.";
  }
  return "Candidate is ready for the technical test.";
}

function recommendationTone(status: CandidateAssessmentStatus) {
  if (status === "passed") return "emerald" as const;
  if (status === "review" || status === "failed") return "amber" as const;
  if (status === "in_progress" || status === "invited") return "blue" as const;
  return "teal" as const;
}

function CandidateHiddenProfileFields({
  candidate
}: {
  candidate: Awaited<ReturnType<typeof getCandidateDetail>>;
}) {
  if (!candidate) return null;

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

function QuickActionForm({
  candidate,
  label,
  variant = "secondary",
  values
}: {
  candidate: NonNullable<Awaited<ReturnType<typeof getCandidateDetail>>>;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  values: Partial<{
    stage: string;
    screeningStatus: string;
    finalDecision: string;
    nextAction: string;
    hrOwner: string;
    notesSummary: string;
  }>;
}) {
  return (
    <form action={`/api/candidates/${candidate.id}`} method="post">
      <CandidateHiddenProfileFields candidate={candidate} />
      <input type="hidden" name="stage" value={values.stage ?? candidate.stage} />
      <input
        type="hidden"
        name="screeningStatus"
        value={values.screeningStatus ?? candidate.screeningStatus ?? ""}
      />
      <input type="hidden" name="finalDecision" value={values.finalDecision ?? candidate.finalDecision} />
      <input type="hidden" name="nextAction" value={values.nextAction ?? candidate.nextAction} />
      <input type="hidden" name="hrOwner" value={values.hrOwner ?? candidate.hrOwner ?? ""} />
      <input type="hidden" name="notesSummary" value={values.notesSummary ?? candidate.notesSummary ?? ""} />
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
  const assessmentStatus = currentAssessmentStatus(candidate);
  const recommendation = recommendationForCandidate(candidate);

  return (
    <SceneShell
      variant="results"
      eyebrow="Candidate"
      title={candidate.fullName}
      subtitle={candidate.email}
      utility={
        <div className="flex flex-wrap gap-2">
          <CandidateStagePill stage={candidate.stage} />
          <CandidateDecisionPill decision={candidate.finalDecision} />
          <Link href={"/candidates" as Route}>
            <Button variant="secondary">Back to tracker</Button>
          </Link>
          <Link href={`/create-test?candidateId=${candidate.id}` as Route}>
            <Button>Create test</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {(pageState.created || pageState.updated || pageState.noteAdded || pageState.resumeUploaded || pageState.error) ? (
          <StagePanel className="space-y-2">
            {pageState.created ? <p className="text-sm text-emerald-200">Candidate created successfully.</p> : null}
            {pageState.updated ? <p className="text-sm text-emerald-200">Candidate updated.</p> : null}
            {pageState.noteAdded ? <p className="text-sm text-emerald-200">Note added.</p> : null}
            {pageState.resumeUploaded ? <p className="text-sm text-emerald-200">Resume uploaded.</p> : null}
            {pageState.error ? <p className="text-sm text-red-200">{pageState.error}</p> : null}
          </StagePanel>
        ) : null}

        <StagePanel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl text-white">Recommended next step</h2>
              <p className="text-sm text-slate-300">{recommendation}</p>
            </div>
            <StatusPill
              label={assessmentStatus === "none" ? "Pre-test" : assessmentStatus.replace("_", " ")}
              tone={recommendationTone(assessmentStatus)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickActionForm
              candidate={candidate}
              label="Screening passed"
              values={{ stage: "testing", screeningStatus: "passed", nextAction: "send_test" }}
            />
            <Link href={`/create-test?candidateId=${candidate.id}` as Route}>
              <Button variant="primary">Send test</Button>
            </Link>
            <QuickActionForm
              candidate={candidate}
              label="Needs result review"
              values={{ stage: "decision", finalDecision: "on_hold", nextAction: "review_result" }}
            />
            <QuickActionForm
              candidate={candidate}
              label="Move to offer"
              values={{ stage: "offer", finalDecision: "selected", nextAction: "prepare_offer" }}
            />
            <QuickActionForm
              candidate={candidate}
              label="Reject candidate"
              variant="danger"
              values={{ stage: "closed", finalDecision: "rejected", nextAction: "close_profile" }}
            />
          </div>
        </StagePanel>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <StagePanel className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">At a glance</h2>
                <p className="text-sm text-slate-300">This page is now optimized for quick progress updates instead of a heavy profile form.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <CandidateScreeningPill status={candidate.screeningStatus} />
                <StatusPill label={candidate.nextAction ? candidateNextActionLabels[candidate.nextAction] : "N/A"} tone="blue" />
                <StatusPill label={candidate.resumeSource || "No source"} tone="neutral" />
                <StatusPill label={candidate.positionAppliedFor || "No position"} tone="neutral" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Candidate</p>
                  <p className="mt-2 text-base text-white">{candidate.fullName}</p>
                  <p className="mt-1 text-sm text-slate-300">{candidate.email}</p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Owner</p>
                  <p className="mt-2 text-base text-white">{candidate.hrOwner || "Unassigned"}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {candidate.candidateFolderUrl ? "Candidate folder linked" : "No folder link yet"}
                  </p>
                </div>
              </div>
            </StagePanel>

            <StagePanel className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Quick status update</h2>
                <p className="text-sm text-slate-300">Most day-to-day updates should happen here.</p>
              </div>

              <form action={`/api/candidates/${candidate.id}`} method="post" className="grid gap-4 lg:grid-cols-2">
                <CandidateHiddenProfileFields candidate={candidate} />

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Stage</span>
                  <select
                    name="stage"
                    defaultValue={candidate.stage}
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  >
                    {candidateStageValues.map((value) => (
                      <option key={value} value={value}>
                        {candidateStageLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Screening status</span>
                  <select
                    name="screeningStatus"
                    defaultValue={candidate.screeningStatus || ""}
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  >
                    <option value="">Not set</option>
                    {candidateScreeningStatusValues.map((value) => (
                      <option key={value} value={value}>
                        {candidateScreeningStatusLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Final decision</span>
                  <select
                    name="finalDecision"
                    defaultValue={candidate.finalDecision}
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  >
                    {candidateFinalDecisionValues.map((value) => (
                      <option key={value} value={value}>
                        {candidateFinalDecisionLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Next action</span>
                  <select
                    name="nextAction"
                    defaultValue={candidate.nextAction}
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  >
                    {candidateNextActionValues.map((value) => (
                      <option key={value} value={value}>
                        {candidateNextActionLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">HR owner</span>
                  <input
                    name="hrOwner"
                    defaultValue={candidate.hrOwner || ""}
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>

                <label className="grid gap-1 lg:col-span-2">
                  <span className="text-sm text-slate-200">Notes summary</span>
                  <textarea
                    name="notesSummary"
                    rows={3}
                    defaultValue={candidate.notesSummary || ""}
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>

                <div className="flex flex-wrap gap-3 lg:col-span-2">
                  <Button type="submit">Save quick update</Button>
                  {candidate.candidateFolderUrl ? (
                    <a href={candidate.candidateFolderUrl} target="_blank" rel="noreferrer">
                      <Button type="button" variant="secondary">Open candidate folder</Button>
                    </a>
                  ) : null}
                </div>
              </form>
            </StagePanel>

            <StagePanel className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Profile details</h2>
                <p className="text-sm text-slate-300">Only update these when needed. They’re intentionally out of the main flow now.</p>
              </div>

              <form action={`/api/candidates/${candidate.id}`} method="post" className="space-y-4">
                <input type="hidden" name="stage" value={candidate.stage} />
                <input type="hidden" name="finalDecision" value={candidate.finalDecision} />
                <input type="hidden" name="nextAction" value={candidate.nextAction} />
                <input type="hidden" name="screeningStatus" value={candidate.screeningStatus || ""} />
                <input type="hidden" name="hrOwner" value={candidate.hrOwner || ""} />
                <input type="hidden" name="notesSummary" value={candidate.notesSummary || ""} />

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
                    <span className="text-sm text-slate-200">Position applied for</span>
                    <input
                      name="positionAppliedFor"
                      defaultValue={candidate.positionAppliedFor || ""}
                      className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-sm text-slate-200">Phone</span>
                    <input
                      name="phone"
                      defaultValue={candidate.phone || ""}
                      className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                    />
                  </label>
                </div>

                <details className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <summary className="cursor-pointer text-sm text-slate-100">More optional details</summary>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Batch ID</span>
                      <input
                        name="batchId"
                        defaultValue={candidate.batchId || ""}
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Resume source</span>
                      <select
                        name="resumeSource"
                        defaultValue={candidate.resumeSource || ""}
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      >
                        <option value="">Select source</option>
                        {resumeSourceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1 lg:col-span-2">
                      <span className="text-sm text-slate-200">Candidate folder link</span>
                      <input
                        name="candidateFolderUrl"
                        defaultValue={candidate.candidateFolderUrl || ""}
                        placeholder="https://..."
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>
                  </div>
                </details>

                <Button type="submit">Save profile details</Button>
              </form>
            </StagePanel>
          </div>

          <div className="space-y-5">
            <StagePanel className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Resume</h2>
                <p className="text-sm text-slate-300">Upload directly from the browser so larger resumes don’t hit Vercel function payload limits.</p>
              </div>

              <ResumeUploader candidateId={candidate.id} />

              {candidate.resumes.length === 0 ? (
                <p className="text-sm text-slate-300">No resume uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {candidate.resumes.map((resume, index) => (
                    <div key={resume.id} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2">
                            {index === 0 ? <StatusPill label="Current resume" tone="blue" /> : null}
                            <StatusPill label={resume.mimeType === "application/pdf" ? "PDF" : "DOCX"} tone="neutral" />
                          </div>
                          <p className="text-sm text-white">{resume.fileName}</p>
                          <p className="text-xs text-slate-400">
                            {Math.max(1, Math.round(resume.sizeBytes / 1024))} KB | Uploaded{" "}
                            {new Date(resume.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <a href={resume.storageUrl} target="_blank" rel="noreferrer">
                          <Button type="button" variant="secondary">
                            {resume.mimeType === "application/pdf" ? "View resume" : "Download resume"}
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </StagePanel>

            <StagePanel className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-2xl text-white">Assessment</h2>
                  <p className="text-sm text-slate-300">Keep using the current builder. Candidate linkage still happens automatically.</p>
                </div>
                <Link href={`/create-test?candidateId=${candidate.id}` as Route}>
                  <Button>Create test</Button>
                </Link>
              </div>

              {candidate.assessments.length === 0 ? (
                <p className="text-sm text-slate-300">No linked assessments yet.</p>
              ) : (
                <div className="space-y-3">
                  {candidate.assessments.map((assessment) => (
                    <div key={assessment.id} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <CandidateAssessmentPill status={assessment.status} />
                            <StatusPill label={`Test ID ${assessment.inviteSlug.toUpperCase()}`} tone="neutral" />
                          </div>
                          <p className="text-sm text-slate-300">
                            Created {new Date(assessment.createdAt).toLocaleString()}
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
                              <Button variant="secondary">Open result</Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </StagePanel>
          </div>
        </div>

        <StagePanel className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Notes & decision log</h2>
            <p className="text-sm text-slate-300">Use short notes as you progress instead of editing a large profile every time.</p>
          </div>

          <form
            action={`/api/candidates/${candidate.id}/notes`}
            method="post"
            className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]"
          >
            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Note type</span>
              <select
                name="type"
                defaultValue="screening"
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                {candidateNoteTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {candidateNoteTypeLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Note</span>
              <textarea
                name="body"
                rows={3}
                required
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            <div className="flex items-end">
              <Button type="submit" className="w-full">Add note</Button>
            </div>
          </form>

          {candidate.notes.length === 0 ? (
            <p className="text-sm text-slate-300">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {candidate.notes.map((note) => (
                <div key={note.id} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <CandidateNoteTypePill type={note.type} />
                      <StatusPill label={new Date(note.createdAt).toLocaleString()} tone="neutral" />
                    </div>
                    {note.createdById ? <p className="text-xs text-slate-400">By {note.createdById}</p> : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{note.body}</p>
                </div>
              ))}
            </div>
          )}
        </StagePanel>
      </div>
    </SceneShell>
  );
}
