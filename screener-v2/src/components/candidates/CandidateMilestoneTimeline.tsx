"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  CandidateAssessmentPill,
  CandidateMilestoneStatusPill,
  CandidateMilestoneTypePill
} from "@/components/candidates/CandidatePills";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import {
  candidateMilestoneResultLabels,
  candidateMilestoneStatusLabels,
  candidateMilestoneStatusValues,
  milestoneCheckDefs,
  type CandidateMilestoneMode,
  type CheckType
} from "@/lib/candidates/milestones";
import type { CandidateMilestoneCheckRecord, CandidateMilestoneRecord } from "@/lib/db/candidates";

const fieldClassName =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";

const timelineNodeClassNames = {
  complete:
    "border-transparent bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-success)_78%,white),color-mix(in_srgb,var(--app-brand)_32%,var(--app-success)))] text-white shadow-[0_16px_32px_color-mix(in_srgb,var(--app-success)_22%,transparent)]",
  active:
    "border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_18px_36px_color-mix(in_srgb,var(--app-brand)_24%,transparent)]",
  pending:
    "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]"
} as const;

function isMilestoneComplete(status: CandidateMilestoneRecord["status"]) {
  return status === "done" || status === "skipped";
}

function defaultActiveMilestoneId(milestones: CandidateMilestoneRecord[], hasResume: boolean) {
  const inProgress = milestones.find((milestone) => milestone.status === "in_progress");
  if (inProgress) {
    return inProgress.id;
  }

  const nextActionable = milestones.find(
    (milestone) =>
      !isMilestoneComplete(milestone.status) && !(milestone.type === "registration" && hasResume)
  );
  return nextActionable?.id ?? milestones[0]?.id ?? "";
}

function derivedResult(milestone: CandidateMilestoneRecord) {
  if (milestone.mode === "manual") {
    return milestone.result;
  }

  if (milestone.assessment?.status === "passed") {
    return "pass" as const;
  }

  if (milestone.assessment?.status === "failed") {
    return "fail" as const;
  }

  if (milestone.assessment?.status === "review") {
    return "review" as const;
  }

  return undefined;
}

function resultTone(result?: string) {
  switch (result) {
    case "pass":
      return "emerald" as const;
    case "fail":
      return "red" as const;
    case "review":
      return "amber" as const;
    default:
      return "neutral" as const;
  }
}

function feedbackLabel(type: CandidateMilestoneRecord["type"]) {
  if (type === "interview") {
    return "Interview notes";
  }

  if (type === "decision") {
    return "Decision notes";
  }

  return "Feedback";
}

function saveButtonLabel(type: CandidateMilestoneRecord["type"], mode: CandidateMilestoneMode) {
  if (type === "screener" || type === "advanced_test" || type === "review_round") {
    return mode === "platform" ? "Save step" : "Save notes";
  }

  return "Save";
}

function stepSummary(milestone: CandidateMilestoneRecord, hasResume: boolean) {
  if (milestone.type === "registration") {
    return hasResume ? "Resume attached." : "Resume missing.";
  }

  if (milestone.mode === "platform") {
    if (milestone.assessment) {
      if (typeof milestone.assessment.finalPercent === "number") {
        return `${candidateMilestoneResultLabels[derivedResult(milestone) ?? "review"]} | ${milestone.assessment.finalPercent.toFixed(1)} / 100`;
      }
      if (milestone.assessment.status === "invited") {
        return "Assessment sent.";
      }
      if (milestone.assessment.status === "in_progress") {
        return "Assessment in progress.";
      }
    }

    return "No assessment yet.";
  }

  if (milestone.result && milestone.result !== "review") {
    return candidateMilestoneResultLabels[milestone.result];
  }

  if (typeof milestone.score === "number") {
    return `Score ${milestone.score}`;
  }

  if (milestone.notes?.trim()) {
    return milestone.notes.trim().slice(0, 120);
  }

  return milestone.status === "not_started" ? "No activity yet." : candidateMilestoneStatusLabels[milestone.status];
}

function MilestoneStatusSelect({
  name,
  defaultValue,
  label = "Step status"
}: {
  name: string;
  defaultValue: CandidateMilestoneRecord["status"];
  label?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">{label}</span>
      <select name={name} defaultValue={defaultValue} className={fieldClassName}>
        {candidateMilestoneStatusValues.map((status) => (
          <option key={status} value={status}>
            {candidateMilestoneStatusLabels[status]}
          </option>
        ))}
      </select>
    </label>
  );
}

function LinkedAssessmentSummary({ milestone }: { milestone: CandidateMilestoneRecord }) {
  const result = derivedResult(milestone);
  const resultHref =
    milestone.assessment?.attemptId && typeof milestone.assessment.finalPercent === "number"
      ? (`/results/${milestone.assessment.attemptId}` as Route)
      : null;
  const shareHref = milestone.assessment?.entryUrl
    ? (`${milestone.assessment.entryUrl}` as Route)
    : null;
  const inviteCode = milestone.assessment?.inviteSlug?.toUpperCase();

  if (!milestone.assessment) {
    return null;
  }

  return (
    <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
      <div className="flex flex-wrap gap-2">
        <CandidateAssessmentPill status={milestone.assessment.status} />
        {result ? (
          <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />
        ) : null}
        {typeof milestone.assessment.finalPercent === "number" ? (
          <StatusPill label={`${milestone.assessment.finalPercent.toFixed(1)} / 100`} tone="blue" />
        ) : null}
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Invite code</p>
          <p className="text-[color:var(--app-heading)]">{inviteCode || "Not available"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Created</p>
          <p className="text-[color:var(--app-heading)]">{new Date(milestone.assessment.createdAt).toLocaleString()}</p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Share path</p>
          <p className="break-all text-[color:var(--app-text)]">
            {shareHref ? shareHref : "Available after the assessment is created."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {shareHref ? (
          <a href={shareHref} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary">
              Open share page
            </Button>
          </a>
        ) : null}
        {resultHref ? (
          <Link href={resultHref}>
            <Button type="button" variant="secondary">
              View result
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function AttachExistingTest({
  candidateId,
  milestoneId
}: {
  candidateId: string;
  milestoneId: string;
}) {
  return (
    <details className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-3">
      <summary className="cursor-pointer list-none text-sm text-[color:var(--app-text)] [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-[color:var(--app-heading)]">Attach an existing assessment</span>
        <span className="ml-2 text-[color:var(--app-muted)]">Use this only when this lifecycle step already has an assessment elsewhere.</span>
      </summary>

      <form
        action={`/api/candidates/${candidateId}/milestones/${milestoneId}`}
        method="post"
        className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
      >
        <input type="hidden" name="action" value="link_existing" />
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Attempt ID</span>
          <input name="attemptId" className={fieldClassName} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Invite slug</span>
          <input name="inviteSlug" className={fieldClassName} />
        </label>
        <Button type="submit" variant="secondary">
          Attach assessment
        </Button>
      </form>
    </details>
  );
}

function TestMilestoneCard({
  candidateId,
  milestone
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
}) {
  const [selectedMode, setSelectedMode] = useState<CandidateMilestoneMode>(milestone.mode);
  const isPlatform = selectedMode === "platform";
  const sendHref = `/create-test?candidateId=${candidateId}&milestoneId=${milestone.id}` as Route;

  return (
    <div className="space-y-3">
      <form action={`/api/candidates/${candidateId}/milestones/${milestone.id}`} method="post" className="space-y-3">
        <input type="hidden" name="action" value="save" />
        <input type="hidden" name="title" value={milestone.title} />
        {isPlatform ? <input type="hidden" name="result" value="" /> : null}

        <div className="flex flex-wrap gap-2">
          <StatusPill label={selectedMode === "platform" ? "In platform" : "External"} tone="neutral" />
          {milestone.date ? (
            <StatusPill label={new Date(milestone.date).toLocaleDateString()} tone="neutral" />
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Step format</span>
            <ChoicePills
              name="mode"
              idPrefix={`milestone-mode-${milestone.id}`}
              value={selectedMode}
              onChange={(value) => setSelectedMode(value as CandidateMilestoneMode)}
              options={[
                { value: "platform", label: "In platform" },
                { value: "manual", label: "External" }
              ]}
            />
          </div>

          <MilestoneStatusSelect name="status" defaultValue={milestone.status} />
        </div>

        {isPlatform ? (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary">
              {saveButtonLabel(milestone.type, selectedMode)}
            </Button>
            {!milestone.assessment ? (
              <Link href={sendHref}>
                <Button type="button">Create assessment</Button>
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Date</span>
                <input
                  name="date"
                  type="datetime-local"
                  defaultValue={milestone.date ? new Date(milestone.date).toISOString().slice(0, 16) : ""}
                  className={fieldClassName}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Score</span>
                <input
                  name="score"
                  type="number"
                  step="0.1"
                  defaultValue={typeof milestone.score === "number" ? String(milestone.score) : ""}
                  placeholder="Optional"
                  className={fieldClassName}
                />
              </label>
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Result</span>
              <ChoicePills
                name="result"
                idPrefix={`milestone-result-${milestone.id}`}
                defaultValue={milestone.result || ""}
                options={[
                  { value: "", label: "Not set" },
                  { value: "pass", label: "Pass" },
                  { value: "fail", label: "Fail" }
                ]}
              />
            </div>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Feedback</span>
              <textarea
                name="notes"
                rows={4}
                defaultValue={milestone.notes || ""}
                className={`${fieldClassName} min-h-[116px] resize-y`}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="submit">{saveButtonLabel(milestone.type, selectedMode)}</Button>
            </div>
          </>
        )}
      </form>

      {isPlatform ? (
        milestone.assessment ? (
          <LinkedAssessmentSummary milestone={milestone} />
        ) : (
          <AttachExistingTest candidateId={candidateId} milestoneId={milestone.id} />
        )
      ) : null}
    </div>
  );
}

function CheckBadge({ status }: { status: string }) {
  const statusClass =
    status === "passed"
      ? "bg-green-100 text-green-800"
      : status === "failed"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
      {status === "passed" ? "✓ Approved" : status === "failed" ? "✗ Rejected" : "Pending"}
    </span>
  );
}

function ScreenerMilestoneCard({
  candidateId,
  milestone
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
}) {
  const [isPending, setIsPending] = useState(false);
  const checks = milestone.checks || [];
  const resumeReviewCheck = checks.find((c) => c.type === "resume_review");
  const screenerTestCheck = checks.find((c) => c.type === "screener_test");
  const defs = milestoneCheckDefs[milestone.type];
  const sendHref = `/create-test?candidateId=${candidateId}&milestoneId=${milestone.id}` as Route;

  const handleCheckAction = async (checkType: CheckType, status: string) => {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("action", "check");
      formData.append("checkType", checkType);
      formData.append("status", status);

      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestone.id}`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        window.location.href = `/candidates/${candidateId}?updated=1`;
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Resume Review</h4>
          {resumeReviewCheck && <CheckBadge status={resumeReviewCheck.status} />}
        </div>
        {resumeReviewCheck?.notes && <p className="text-xs text-[color:var(--app-muted)]">{resumeReviewCheck.notes}</p>}
        {!resumeReviewCheck || resumeReviewCheck.status === "not_started" ? (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleCheckAction("resume_review", "passed")}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
            >
              Approve
            </button>
            <button
              onClick={() => handleCheckAction("resume_review", "failed")}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Screener Test</h4>
          {screenerTestCheck && <CheckBadge status={screenerTestCheck.status} />}
        </div>
        {screenerTestCheck?.notes && <p className="text-xs text-[color:var(--app-muted)]">{screenerTestCheck.notes}</p>}
        <div className="space-y-3 pt-2">
          {!milestone.assessment ? (
            <Link href={sendHref}>
              <Button type="button" variant="secondary">
                Create assessment
              </Button>
            </Link>
          ) : (
            <LinkedAssessmentSummary milestone={milestone} />
          )}
        </div>
      </div>
    </div>
  );
}

function RegistrationMilestoneCard({
  candidateId,
  milestone,
  hasResume
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
  hasResume: boolean;
}) {
  const checks = milestone.checks || [];
  const resumeUploadCheck = checks.find((c) => c.type === "resume_upload");

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Resume Upload</h4>
          {resumeUploadCheck && <CheckBadge status={resumeUploadCheck.status} />}
        </div>
        {resumeUploadCheck?.notes && (
          <p className="text-xs text-[color:var(--app-muted)]">{resumeUploadCheck.notes}</p>
        )}
        {!hasResume ? (
          <div className="pt-2">
            <Link href={`/candidates/${candidateId}#resume` as Route}>
              <Button type="button" variant="secondary">
                Add resume
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MilestonePanelContent({
  candidateId,
  milestone,
  hasResume
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
  hasResume: boolean;
}) {
  if (milestone.type === "registration") {
    return <RegistrationMilestoneCard candidateId={candidateId} milestone={milestone} hasResume={hasResume} />;
  }

  if (milestone.type === "screener") {
    return <ScreenerMilestoneCard candidateId={candidateId} milestone={milestone} />;
  }

  if (milestone.type === "advanced_test" || milestone.type === "review_round") {
    return <TestMilestoneCard candidateId={candidateId} milestone={milestone} />;
  }

  return <DocumentationMilestoneCard candidateId={candidateId} milestone={milestone} />;
}

function DocumentationMilestoneCard({
  candidateId,
  milestone
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
}) {
  return (
    <form action={`/api/candidates/${candidateId}/milestones/${milestone.id}`} method="post" className="space-y-3">
      <input type="hidden" name="action" value="save" />
      <input type="hidden" name="title" value={milestone.title} />
      <input type="hidden" name="mode" value={milestone.mode} />

      {milestone.date ? (
        <div className="flex flex-wrap gap-2">
          <StatusPill label={new Date(milestone.date).toLocaleDateString()} tone="neutral" />
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px] md:items-end">
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Date</span>
          <input
            name="date"
            type="datetime-local"
            defaultValue={milestone.date ? new Date(milestone.date).toISOString().slice(0, 16) : ""}
            className={fieldClassName}
          />
        </label>

        <MilestoneStatusSelect name="status" defaultValue={milestone.status} />
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Result</span>
        <ChoicePills
          name="result"
          idPrefix={`doc-result-${milestone.id}`}
          defaultValue={milestone.result || ""}
          options={
            milestone.type === "decision"
              ? [
                  { value: "", label: "Not set" },
                  { value: "accept", label: "Accept" },
                  { value: "decline", label: "Decline" },
                  { value: "on_hold", label: "On hold" }
                ]
              : [
                  { value: "", label: "Not set" },
                  { value: "pass", label: "Pass" },
                  { value: "fail", label: "Fail" },
                  { value: "review", label: "Review" }
                ]
          }
        />
      </div>

      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">{feedbackLabel(milestone.type)}</span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={milestone.notes || ""}
          className={`${fieldClassName} min-h-[116px] resize-y`}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CandidateMilestoneTimeline({
  candidateId,
  milestones,
  hasResume
}: {
  candidateId: string;
  milestones: CandidateMilestoneRecord[];
  hasResume: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [activeMilestoneId, setActiveMilestoneId] = useState(() =>
    defaultActiveMilestoneId(milestones, hasResume)
  );

  useEffect(() => {
    if (milestones.some((milestone) => milestone.id === activeMilestoneId)) {
      return;
    }

    setActiveMilestoneId(defaultActiveMilestoneId(milestones, hasResume));
  }, [activeMilestoneId, hasResume, milestones]);

  const activeMilestone =
    milestones.find((milestone) => milestone.id === activeMilestoneId) ?? milestones[0] ?? null;

  if (!activeMilestone) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px] px-1">
          <div className="flex items-start">
            {milestones.map((milestone, index) => {
              const result = derivedResult(milestone);
              const isActive = milestone.id === activeMilestone.id;
              const isComplete = isMilestoneComplete(milestone.status);
              const segmentFilled = isMilestoneComplete(milestone.status);
              const nodeState = isComplete ? "complete" : isActive ? "active" : "pending";

              return (
                <div key={milestone.id} className="flex min-w-0 flex-1 items-start">
                  <button
                    type="button"
                    onClick={() => setActiveMilestoneId(milestone.id)}
                    className="group flex w-40 shrink-0 flex-col items-center text-center"
                  >
                    <span
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition duration-300 ${timelineNodeClassNames[nodeState]}`}
                    >
                      {isActive ? (
                        <span className="absolute inset-[-6px] rounded-full border border-[color:var(--app-brand)]/35" />
                      ) : null}
                      <span className="relative z-[1]">
                        {isComplete ? (
                          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                            <path
                              d="M5 10.5L8.2 13.7L15 6.8"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                    </span>
                    <span className="mt-3 text-sm font-medium text-[color:var(--app-heading)]">{milestone.title}</span>
                    <span className="mt-1 max-w-[10rem] text-xs leading-5 text-[color:var(--app-muted)]">
                      {stepSummary(milestone, hasResume)}
                    </span>
                    <span className="mt-2 flex flex-wrap justify-center gap-2">
                      <CandidateMilestoneStatusPill status={milestone.status} />
                      {result ? (
                        <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />
                      ) : null}
                    </span>
                  </button>

                  {index < milestones.length - 1 ? (
                    <div className="mt-5 flex min-w-[72px] flex-1 items-center px-2">
                      <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-[color:var(--app-border)]">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(135deg,var(--app-brand),color-mix(in_srgb,var(--app-success)_68%,var(--app-brand)))]"
                          initial={reduceMotion ? false : { scaleX: 0 }}
                          animate={{ scaleX: segmentFilled ? 1 : 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                          style={{ width: "100%", transformOrigin: "left center" }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface-soft)_92%,white),color-mix(in_srgb,var(--app-surface)_94%,black))] p-5 shadow-[var(--app-shadow-soft)]">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <CandidateMilestoneTypePill type={activeMilestone.type} />
                <CandidateMilestoneStatusPill status={activeMilestone.status} />
                {derivedResult(activeMilestone) ? (
                  <StatusPill
                    label={candidateMilestoneResultLabels[derivedResult(activeMilestone) ?? "review"]}
                    tone={resultTone(derivedResult(activeMilestone))}
                  />
                ) : null}
                {activeMilestone.assessment?.status === "in_progress" ? (
                  <CandidateAssessmentPill status={activeMilestone.assessment.status} />
                ) : null}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl text-[color:var(--app-heading)]">{activeMilestone.title}</h3>
                <p className="max-w-2xl text-sm text-[color:var(--app-text)]">
                  {stepSummary(activeMilestone, hasResume)}
                </p>
              </div>
            </div>

            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)]">
              <ChevronIcon />
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeMilestone.id}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-[color:var(--app-border)] pt-4"
            >
              <MilestonePanelContent
                candidateId={candidateId}
                milestone={activeMilestone}
                hasResume={hasResume}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

