"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { CheckCircle2, MinusCircle, X, XCircle } from "lucide-react";
import type { AddonCatalogEntry, AssessmentPresetEntry } from "@/lib/addons/catalog";
import {
  CandidateAssessmentPill,
  CandidateMilestoneStatusPill,
  CandidateMilestoneTypePill
} from "@/components/candidates/CandidatePills";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidateAssessmentBuilderOverlay } from "@/components/candidates/CandidateAssessmentBuilderOverlay";
import { TestSubmissionModal } from "@/components/candidates/TestSubmissionModal";
import { InterviewSchedulingModal } from "@/components/candidates/InterviewSchedulingModal";
import { InterviewScorecardModal } from "@/components/candidates/InterviewScorecardModal";
import { SelfSchedulingDrawer } from "@/components/candidates/SelfSchedulingDrawer";
import {
  candidateMilestoneResultLabels,
  candidateMilestoneStatusLabels,
  candidateMilestoneStatusValues,
  type CandidateMilestoneMode,
  type CandidateMilestoneResult,
  type CheckType
} from "@/lib/candidates/milestones";
import type { CandidateMilestoneRecord } from "@/lib/db/candidates";
import type { WorkflowChannelSummary } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

type TimelineNode =
  | CandidateMilestoneRecord
  | { id: string; type: "__advanced_review"; groupedMilestones: CandidateMilestoneRecord[] };

function isAdvancedReviewGroup(
  node: TimelineNode
): node is { id: string; type: "__advanced_review"; groupedMilestones: CandidateMilestoneRecord[] } {
  return node.type === "__advanced_review";
}

function groupMilestonesForTimeline(milestones: CandidateMilestoneRecord[]): TimelineNode[] {
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
  const result: TimelineNode[] = [];
  let advancedMilestones: CandidateMilestoneRecord[] = [];

  for (const m of sorted) {
    if (m.type === "finalized") {
      if (advancedMilestones.length > 0) {
        result.push({
          id: "advanced_review_group",
          type: "__advanced_review",
          groupedMilestones: advancedMilestones
        });
        advancedMilestones = [];
      }
      result.push(m);
    } else if (m.sortOrder >= 40 && m.sortOrder < 9999) {
      advancedMilestones.push(m);
    } else {
      result.push(m);
    }
  }

  if (advancedMilestones.length > 0) {
    result.push({
      id: "advanced_review_group",
      type: "__advanced_review",
      groupedMilestones: advancedMilestones
    });
  }

  return result;
}

const fieldClassName =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";

function isMilestoneComplete(status: CandidateMilestoneRecord["status"]) {
  return status === "done" || status === "skipped";
}

function defaultActiveMilestoneId(milestones: CandidateMilestoneRecord[], hasResume: boolean) {
  const inProgress = milestones.find((m) => m.status === "in_progress");
  if (inProgress) return inProgress.id;

  const nextActionable = milestones.find(
    (m) => !isMilestoneComplete(m.status) && !(m.type === "registration" && hasResume)
  );
  return nextActionable?.id ?? milestones[0]?.id ?? "advanced_review_group";
}

function derivedResult(milestone: CandidateMilestoneRecord) {
  if (milestone.mode === "manual") return milestone.result;
  if (milestone.assessment?.status === "passed") return "pass" as const;
  if (milestone.assessment?.status === "failed") return "fail" as const;
  if (milestone.assessment?.status === "review") return "review" as const;
  return undefined;
}

function resultTone(result?: string) {
  switch (result) {
    case "pass": return "emerald" as const;
    case "fail": return "red" as const;
    case "review": return "amber" as const;
    default: return "neutral" as const;
  }
}

function feedbackLabel(type: CandidateMilestoneRecord["type"]) {
  if (type === "interview") return "Interview notes";
  if (type === "finalized") return "Finalized notes";
  return "Feedback";
}

function interviewFormatLabel(format?: string) {
  if (!format) return "Interview";
  if (format === "video") return "Video";
  if (format === "phone") return "Phone";
  if (format === "onsite") return "On-site";
  return format;
}

function displayMilestoneTitle(milestone: CandidateMilestoneRecord) {
  if (milestone.type === "registration") return "Applied";
  if (milestone.type === "screener") return "Screening";
  return milestone.title;
}

function saveButtonLabel(type: CandidateMilestoneRecord["type"], mode: CandidateMilestoneMode) {
  if (type === "screener" || type === "advanced_review" || type === "review_round") {
    return mode === "platform" ? "Save step" : "Save notes";
  }
  return "Save";
}

function stepSummary(milestone: CandidateMilestoneRecord, hasResume: boolean) {
  if (milestone.type === "registration") {
    return hasResume ? "Resume attached." : "Resume missing.";
  }

  if (milestone.type === "interview" && milestone.interviewPanel?.scheduledAt) {
    const memberCount = milestone.interviewPanel.members.length;
    return `${new Date(milestone.interviewPanel.scheduledAt).toLocaleString()} · ${interviewFormatLabel(milestone.interviewPanel.format)}${memberCount > 0 ? ` · ${memberCount} interviewer${memberCount === 1 ? "" : "s"}` : ""}`;
  }

  if (milestone.mode === "platform") {
    if (milestone.assessment) {
      if (typeof milestone.assessment.finalPercent === "number") {
        return `${candidateMilestoneResultLabels[derivedResult(milestone) ?? "review"]} · ${milestone.assessment.finalPercent.toFixed(1)} / 100`;
      }
      if (milestone.assessment.status === "invited") return "Assessment assigned.";
      if (milestone.assessment.status === "in_progress") return "Assessment in progress.";
    }
    return "No assessment yet.";
  }

  if (milestone.result && milestone.result !== "review") {
    return candidateMilestoneResultLabels[milestone.result];
  }

  if (typeof milestone.score === "number") return `Score ${milestone.score}`;

  if (milestone.notes?.trim()) return milestone.notes.trim().slice(0, 120);

  return milestone.status === "not_started"
    ? "Not started"
    : candidateMilestoneStatusLabels[milestone.status];
}

function withStatusQuery(href: string, key: string, value = "1") {
  const url = new URL(href, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}` as Route;
}

// ─── Stage Rail ──────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function nodeRailState(
  node: TimelineNode,
  isActive: boolean
): "complete" | "active" | "pending" | "failed" {
  if (isAdvancedReviewGroup(node)) {
    const all = node.groupedMilestones;
    if (all.every((m) => isMilestoneComplete(m.status))) return "complete";
    if (isActive || all.some((m) => m.status === "in_progress" || m.status === "done")) return "active";
    return "pending";
  }
  if (isMilestoneComplete(node.status)) return "complete";
  if (node.status === "failed") return "failed";
  if (isActive || node.status === "in_progress") return "active";
  return "pending";
}

function railNodeTitle(node: TimelineNode): string {
  if (isAdvancedReviewGroup(node)) return "Review";
  if (node.type === "registration") return "Applied";
  if (node.type === "screener") return "Screening";
  if (node.type === "finalized") return "Final";
  return node.title;
}

// ─── Milestone panel sub-cards ───────────────────────────────────────────────

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

  if (!milestone.assessment) return null;

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
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Invite code</p>
          <p className="text-[color:var(--app-heading)]">{inviteCode || "Not available"}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Created</p>
          <p className="text-[color:var(--app-heading)]">{new Date(milestone.assessment.createdAt).toLocaleString()}</p>
        </div>
        <div className="space-y-0.5 md:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Share path</p>
          <p className="break-all text-[color:var(--app-text)]">
            {shareHref ? shareHref : "Available after the assessment is created."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {shareHref ? (
          <a href={shareHref} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary">Open share page</Button>
          </a>
        ) : null}
        {resultHref ? (
          <Link href={resultHref}>
            <Button type="button" variant="secondary">View result</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function CheckBadge({ status }: { status: string }) {
  const tone = status === "passed" ? ("emerald" as const) : status === "failed" ? ("red" as const) : ("neutral" as const);
  const label = status === "passed" ? "Approved" : status === "failed" ? "Rejected" : "Needs attention";
  return <StatusPill tone={tone} label={label} />;
}

function RegistrationMilestoneCard({
  milestone,
  hasResume,
  detailHref
}: {
  milestone: CandidateMilestoneRecord;
  hasResume: boolean;
  detailHref: string;
}) {
  const checks = milestone.checks || [];
  const resumeUploadCheck = checks.find((c) => c.type === "resume_upload");

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[color:var(--app-heading)]">Resume</h4>
          {resumeUploadCheck ? <CheckBadge status={resumeUploadCheck.status} /> : null}
        </div>
        {resumeUploadCheck?.notes ? (
          <p className="text-xs text-[color:var(--app-muted)]">{resumeUploadCheck.notes}</p>
        ) : null}
        {!hasResume ? (
          <div className="pt-1">
            <Link href={`${detailHref}#resume` as Route}>
              <Button type="button" variant="secondary">Upload resume</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScreenerMilestoneCard({
  candidateId,
  milestone,
  detailHref,
  assessmentAddons,
  assessmentPresets,
  assessmentWorkspaceLabel
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
  detailHref: string;
  assessmentAddons: AddonCatalogEntry[];
  assessmentPresets: AssessmentPresetEntry[];
  assessmentWorkspaceLabel?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const checks = milestone.checks || [];
  const resumeReviewCheck = checks.find((c) => c.type === "resume_review");
  const screenerTestCheck = checks.find((c) => c.type === "screener_test");

  const handleCheckAction = async (checkType: CheckType, status: string) => {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("action", "check");
      formData.append("checkType", checkType);
      formData.append("status", status);
      formData.append("returnTo", detailHref);

      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestone.id}`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        router.replace(withStatusQuery(detailHref, "updated"));
        router.refresh();
      } else {
        const data = await response.json();
        setCheckError(data.message || "Could not update check. Please try again.");
      }
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : "Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleUnlinkAssessment = async () => {
    setIsUnlinking(true);
    setCheckError("");
    try {
      const formData = new FormData();
      formData.append("action", "unlink_assessment");
      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestone.id}`, {
        method: "POST",
        body: formData
      });
      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        setCheckError(data.message || "Could not unlink assessment.");
      }
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : "Network error.");
    } finally {
      setIsUnlinking(false);
    }
  };

  const canManualOverride =
    milestone.mode === "platform" &&
    !!milestone.assessment &&
    screenerTestCheck?.status !== "passed";

  return (
    <div className="space-y-4">
      {checkError ? (
        <div className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]">
          {checkError}
        </div>
      ) : null}

      <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-[color:var(--app-heading)]">Resume review</h4>
            <p className="text-xs text-[color:var(--app-muted)]">
              {resumeReviewCheck?.status === "passed"
                ? "Resume approved — candidate can proceed to screening."
                : resumeReviewCheck?.status === "failed"
                  ? "Resume did not meet requirements."
                  : resumeReviewCheck?.status === "skipped"
                    ? "Resume review skipped."
                    : "Review the attached resume before advancing the candidate."}
            </p>
          </div>
          {resumeReviewCheck ? <CheckBadge status={resumeReviewCheck.status} /> : null}
        </div>
        {resumeReviewCheck?.notes ? (
          <p className="mt-2 text-xs text-[color:var(--app-muted)] italic">{resumeReviewCheck.notes}</p>
        ) : null}
        {(!resumeReviewCheck || resumeReviewCheck.status === "not_started") ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--app-border)] pt-3">
            <button
              type="button"
              onClick={() => handleCheckAction("resume_review", "passed")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isPending ? "Updating…" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => handleCheckAction("resume_review", "failed")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              {isPending ? "Updating…" : "Reject"}
            </button>
            <button
              type="button"
              onClick={() => handleCheckAction("resume_review", "skipped")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1.5 text-xs font-medium text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)] disabled:opacity-50"
            >
              <MinusCircle className="h-3.5 w-3.5" />
              Skip
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 border-t border-[color:var(--app-border)] pt-3">
            <button
              type="button"
              onClick={() => handleCheckAction("resume_review", "not_started")}
              disabled={isPending}
              className="text-xs text-[color:var(--app-muted)] underline-offset-2 transition hover:underline disabled:opacity-50"
            >
              Reset decision
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[color:var(--app-heading)]">Screening assessment</h4>
          {screenerTestCheck ? <CheckBadge status={screenerTestCheck.status} /> : null}
        </div>
        {!milestone.assessment ? (
          <div className="pt-1">
            <Button type="button" variant="secondary" onClick={() => setBuilderOpen(true)}>
              Create assessment
            </Button>
          </div>
        ) : (
          <>
            <LinkedAssessmentSummary milestone={milestone} />
            <div className="flex flex-wrap gap-2 border-t border-[color:var(--app-border)] pt-3">
              {canManualOverride ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCheckAction("screener_test", "passed")}
                  disabled={isPending}
                >
                  {isPending ? "Updating…" : "Mark as complete"}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={handleUnlinkAssessment}
                disabled={isUnlinking}
                className="text-[color:var(--app-danger)]"
              >
                {isUnlinking ? "Unlinking…" : "Unlink assessment"}
              </Button>
            </div>
          </>
        )}
      </div>

      <CandidateAssessmentBuilderOverlay
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onInviteCreated={() => router.refresh()}
        initialAddons={assessmentAddons}
        initialPresets={assessmentPresets}
        linkedCandidateId={candidateId}
        linkedCandidateMilestoneId={milestone.id}
        eyebrow={assessmentWorkspaceLabel ? `${assessmentWorkspaceLabel} assessment` : "Candidate assessment"}
        title="Create a screening assessment"
        subtitle="Build the screening assessment and keep the candidate profile anchored to this workspace."
      />
    </div>
  );
}

function TestMilestoneCard({
  candidateId,
  milestone,
  detailHref,
  assessmentAddons,
  assessmentPresets,
  assessmentWorkspaceLabel
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
  detailHref: string;
  assessmentAddons: AddonCatalogEntry[];
  assessmentPresets: AssessmentPresetEntry[];
  assessmentWorkspaceLabel?: string;
}) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<CandidateMilestoneMode>(milestone.mode);
  const [builderOpen, setBuilderOpen] = useState(false);
  const isPlatform = selectedMode === "platform";

  return (
    <div className="space-y-3">
      <form action={`/api/candidates/${candidateId}/milestones/${milestone.id}`} method="post" className="space-y-3">
        <input type="hidden" name="action" value="save" />
        <input type="hidden" name="title" value={milestone.title} />
        <input type="hidden" name="returnTo" value={detailHref} />
        {isPlatform ? <input type="hidden" name="result" value="" /> : null}

        <div className="flex flex-wrap gap-2">
          <StatusPill label={selectedMode === "platform" ? "In platform" : "External"} tone="neutral" />
          {milestone.date ? (
            <StatusPill label={new Date(milestone.date).toLocaleDateString()} tone="neutral" />
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Format</span>
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
            <Button type="submit" variant="secondary">{saveButtonLabel(milestone.type, selectedMode)}</Button>
            {!milestone.assessment ? (
              <Button type="button" onClick={() => setBuilderOpen(true)}>Create assessment</Button>
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

      {isPlatform && milestone.assessment ? <LinkedAssessmentSummary milestone={milestone} /> : null}

      <CandidateAssessmentBuilderOverlay
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onInviteCreated={() => router.refresh()}
        initialAddons={assessmentAddons}
        initialPresets={assessmentPresets}
        linkedCandidateId={candidateId}
        linkedCandidateMilestoneId={milestone.id}
        eyebrow={assessmentWorkspaceLabel ? `${assessmentWorkspaceLabel} assessment` : "Candidate assessment"}
        title="Create a screening assessment"
        subtitle="Build the assessment and keep the candidate open. Refresh the linked evidence here."
      />
    </div>
  );
}

function InterviewMilestoneCard({
  candidateId,
  milestone,
  availableInterviewers,
  schedulingChannel
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
  availableInterviewers: Array<{ id: string; name: string | null; email: string }>;
  schedulingChannel?: WorkflowChannelSummary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [selfScheduleOpen, setSelfScheduleOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-[color:var(--app-heading)]">Interview schedule</h4>
            <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">
              {milestone.interviewPanel?.scheduledAt
                ? `Scheduled ${new Date(milestone.interviewPanel.scheduledAt).toLocaleString()}`
                : "No interview scheduled yet."}
            </p>
          </div>
          {milestone.interviewPanel?.scheduledAt ? (
            <StatusPill label="Scheduled" tone="blue" />
          ) : (
            <StatusPill label="Not scheduled" tone="neutral" />
          )}
        </div>

        {milestone.interviewPanel ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Format</p>
              <p className="text-sm text-[color:var(--app-heading)]">{interviewFormatLabel(milestone.interviewPanel.format)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Duration</p>
              <p className="text-sm text-[color:var(--app-heading)]">{milestone.interviewPanel.durationMin} min</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Interviewers</p>
              <p className="text-sm text-[color:var(--app-heading)]">
                {milestone.interviewPanel.members.length > 0
                  ? milestone.interviewPanel.members.map((m) => m.user.name || m.user.email).join(", ")
                  : "None selected"}
              </p>
            </div>
            {milestone.interviewPanel.meetingUrl ? (
              <div className="space-y-0.5 md:col-span-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Meeting link</p>
                <a
                  href={milestone.interviewPanel.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[color:var(--app-brand)] hover:underline break-all"
                >
                  {milestone.interviewPanel.meetingUrl}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" onClick={() => setOpen(true)}>
            {milestone.interviewPanel ? "Reschedule" : "Schedule interview"}
          </Button>
          {milestone.interviewPanel ? (
            <Button type="button" variant="secondary" onClick={() => setScorecardOpen(true)}>
              Scorecard
            </Button>
          ) : null}
          {milestone.interviewPanel ? (
            <Button type="button" variant="secondary" onClick={() => setSelfScheduleOpen(true)}>
              Send scheduling link
            </Button>
          ) : null}
        </div>
      </div>

      {milestone.interviewPanel ? (
        <InterviewScorecardModal
          panelId={milestone.interviewPanel.id}
          panelName={milestone.interviewPanel.roundName}
          isOpen={scorecardOpen}
          onClose={() => setScorecardOpen(false)}
          onSuccess={() => { setScorecardOpen(false); router.refresh(); }}
        />
      ) : null}

      <InterviewSchedulingModal
        isOpen={open}
        onClose={() => setOpen(false)}
        candidateId={candidateId}
        milestoneId={milestone.id}
        milestone={{ date: milestone.date, result: milestone.result, notes: milestone.notes }}
        interviewPanel={milestone.interviewPanel ?? null}
        availableInterviewers={availableInterviewers}
        schedulingChannel={schedulingChannel}
        onSuccess={() => { setOpen(false); router.refresh(); }}
      />

      {milestone.interviewPanel ? (
        <SelfSchedulingDrawer
          isOpen={selfScheduleOpen}
          onClose={() => setSelfScheduleOpen(false)}
          panelId={milestone.interviewPanel.id}
          roundName={milestone.interviewPanel.roundName}
          durationMin={milestone.interviewPanel.durationMin}
        />
      ) : null}
    </div>
  );
}

function DocumentationMilestoneCard({
  candidateId,
  milestone,
  detailHref
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
  detailHref: string;
}) {
  return (
    <form action={`/api/candidates/${candidateId}/milestones/${milestone.id}`} method="post" className="space-y-3">
      <input type="hidden" name="action" value="save" />
      <input type="hidden" name="title" value={milestone.title} />
      <input type="hidden" name="mode" value={milestone.mode} />
      <input type="hidden" name="returnTo" value={detailHref} />

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
            milestone.type === "finalized"
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

function AdvancedReviewCard({
  candidateId,
  groupedMilestones,
  assessmentAddons,
  assessmentPresets,
  assessmentWorkspaceLabel,
  availableInterviewers,
  schedulingChannel
}: {
  candidateId: string;
  groupedMilestones: CandidateMilestoneRecord[];
  assessmentAddons: AddonCatalogEntry[];
  assessmentPresets: AssessmentPresetEntry[];
  assessmentWorkspaceLabel?: string;
  availableInterviewers: Array<{ id: string; name: string | null; email: string }>;
  schedulingChannel?: WorkflowChannelSummary;
}) {
  const router = useRouter();
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [isCreatingInterview, setIsCreatingInterview] = useState(false);
  const [createError, setCreateError] = useState("");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [pendingMilestoneId, setPendingMilestoneId] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const handleAddMilestone = async (type: "advanced_review" | "interview") => {
    setCreateError("");
    const setter = type === "advanced_review" ? setIsCreatingTest : setIsCreatingInterview;
    try {
      setter(true);
      const response = await fetch(`/api/candidates/${candidateId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (response.ok) {
        const newMilestone = await response.json();
        setPendingMilestoneId(newMilestone.id);
        if (type === "advanced_review") setTestModalOpen(true);
        else setInterviewModalOpen(true);
      } else {
        const data = await response.json();
        setCreateError(data.error || "Failed to create milestone");
        setter(false);
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Error creating milestone");
      setter(false);
    }
  };

  const handleModalClose = () => {
    setTestModalOpen(false);
    setInterviewModalOpen(false);
    setIsCreatingTest(false);
    setIsCreatingInterview(false);
    setEditingMilestoneId(null);
    setPendingMilestoneId("");
  };

  const handleModalSuccess = () => {
    setPendingMilestoneId("");
    setEditingMilestoneId(null);
    handleModalClose();
    router.refresh();
  };

  const handleDeleteMilestone = async (milestoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this item? This action is logged.")) return;
    try {
      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestoneId}`, { method: "DELETE" });
      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        setCreateError(data.error || "Failed to delete milestone");
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error deleting milestone");
    }
  };

  const editingMilestone = editingMilestoneId
    ? groupedMilestones.find((m) => m.id === editingMilestoneId)
    : null;

  return (
    <div className="space-y-5">
      {createError ? (
        <div className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]">
          {createError}
        </div>
      ) : null}

      {groupedMilestones.length > 0 ? (
        <div className="space-y-2">
          {groupedMilestones.map((m) => {
            const result = derivedResult(m);
            const canCreateAssessment = m.mode === "platform" && !m.assessment;
            const handleEdit = () => {
              setEditingMilestoneId(m.id);
              if (m.type === "advanced_review" || m.type === "review_round") setTestModalOpen(true);
              else if (m.type === "interview") setInterviewModalOpen(true);
            };
            return (
              <div
                key={m.id}
                className="group rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={handleEdit} className="flex-1 text-left">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CandidateMilestoneTypePill type={m.type} />
                        <CandidateMilestoneStatusPill status={m.status} />
                        {result ? (
                          <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--app-heading)]">{m.title}</p>
                        <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">{stepSummary(m, false)}</p>
                      </div>
                      {canCreateAssessment ? (
                        <span className="inline-flex rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1 text-xs text-[color:var(--app-heading)]">
                          Create assessment
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMilestone(m.id, e)}
                    className="rounded p-1.5 opacity-0 transition hover:bg-[color:var(--app-danger)]/10 group-hover:opacity-100"
                    aria-label="Delete milestone"
                  >
                    <X className="h-4 w-4 text-[color:var(--app-danger)]" />
                  </button>
                </div>
                {m.assessment ? <LinkedAssessmentSummary milestone={m} /> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[16px] border border-dashed border-[color:var(--app-border)] p-6 text-center">
          <p className="text-sm text-[color:var(--app-muted)]">No additional assessments or interview notes yet.</p>
        </div>
      )}

      <div className="space-y-3 border-t border-[color:var(--app-border)] pt-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Add more</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={() => handleAddMilestone("advanced_review")} disabled={isCreatingTest} variant="secondary" className="flex-1">
            {isCreatingTest ? "Creating…" : "Add assessment"}
          </Button>
          <Button type="button" onClick={() => handleAddMilestone("interview")} disabled={isCreatingInterview} variant="secondary" className="flex-1">
            {isCreatingInterview ? "Creating…" : "Add interview note"}
          </Button>
        </div>
      </div>

      {(pendingMilestoneId || editingMilestoneId) ? (
        <>
          <TestSubmissionModal
            isOpen={testModalOpen}
            onClose={handleModalClose}
            candidateId={candidateId}
            milestoneId={pendingMilestoneId || editingMilestoneId || ""}
            milestone={editingMilestone ? {
              mode: editingMilestone.mode,
              date: editingMilestone.date,
              score: editingMilestone.score,
              result: editingMilestone.result,
              notes: editingMilestone.notes
            } : undefined}
            onSuccess={handleModalSuccess}
            assessmentAddons={assessmentAddons}
            assessmentPresets={assessmentPresets}
            assessmentWorkspaceLabel={assessmentWorkspaceLabel}
          />
          <InterviewSchedulingModal
            isOpen={interviewModalOpen}
            onClose={handleModalClose}
            candidateId={candidateId}
            milestoneId={pendingMilestoneId || editingMilestoneId || ""}
            milestone={editingMilestone ? {
              date: editingMilestone.date,
              result: editingMilestone.result,
              notes: editingMilestone.notes
            } : undefined}
            interviewPanel={editingMilestone?.interviewPanel ?? null}
            availableInterviewers={availableInterviewers}
            schedulingChannel={schedulingChannel}
            onSuccess={handleModalSuccess}
          />
        </>
      ) : null}
    </div>
  );
}

function MilestonePanelContent({
  candidateId,
  node,
  hasResume,
  detailHref,
  assessmentAddons,
  assessmentPresets,
  assessmentWorkspaceLabel,
  availableInterviewers,
  schedulingChannel
}: {
  candidateId: string;
  node: TimelineNode;
  hasResume: boolean;
  detailHref: string;
  assessmentAddons: AddonCatalogEntry[];
  assessmentPresets: AssessmentPresetEntry[];
  assessmentWorkspaceLabel?: string;
  availableInterviewers: Array<{ id: string; name: string | null; email: string }>;
  schedulingChannel?: WorkflowChannelSummary;
}) {
  if (isAdvancedReviewGroup(node)) {
    return (
      <AdvancedReviewCard
        candidateId={candidateId}
        groupedMilestones={node.groupedMilestones}
        assessmentAddons={assessmentAddons}
        assessmentPresets={assessmentPresets}
        assessmentWorkspaceLabel={assessmentWorkspaceLabel}
        availableInterviewers={availableInterviewers}
        schedulingChannel={schedulingChannel}
      />
    );
  }

  if (node.type === "registration") return <RegistrationMilestoneCard milestone={node} hasResume={hasResume} detailHref={detailHref} />;
  if (node.type === "screener") return <ScreenerMilestoneCard candidateId={candidateId} milestone={node} detailHref={detailHref} assessmentAddons={assessmentAddons} assessmentPresets={assessmentPresets} assessmentWorkspaceLabel={assessmentWorkspaceLabel} />;
  if (node.type === "interview") return <InterviewMilestoneCard candidateId={candidateId} milestone={node} availableInterviewers={availableInterviewers} schedulingChannel={schedulingChannel} />;
  if (node.type === "advanced_review" || node.type === "review_round") return <TestMilestoneCard candidateId={candidateId} milestone={node} detailHref={detailHref} assessmentAddons={assessmentAddons} assessmentPresets={assessmentPresets} assessmentWorkspaceLabel={assessmentWorkspaceLabel} />;
  return <DocumentationMilestoneCard candidateId={candidateId} milestone={node} detailHref={detailHref} />;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CandidateMilestoneTimeline({
  candidateId,
  milestones,
  hasResume,
  detailHref,
  assessmentAddons,
  assessmentPresets,
  assessmentWorkspaceLabel,
  availableInterviewers,
  schedulingChannel
}: {
  candidateId: string;
  milestones: CandidateMilestoneRecord[];
  hasResume: boolean;
  detailHref: string;
  assessmentAddons: AddonCatalogEntry[];
  assessmentPresets: AssessmentPresetEntry[];
  assessmentWorkspaceLabel?: string;
  availableInterviewers: Array<{ id: string; name: string | null; email: string }>;
  schedulingChannel?: WorkflowChannelSummary;
}) {
  const reduceMotion = useReducedMotion();
  const timelineNodes = groupMilestonesForTimeline(milestones);

  const [activeMilestoneId, setActiveMilestoneId] = useState(() =>
    defaultActiveMilestoneId(milestones, hasResume)
  );

  useEffect(() => {
    const exists =
      milestones.some((m) => m.id === activeMilestoneId) ||
      activeMilestoneId === "advanced_review_group";
    if (!exists) setActiveMilestoneId(defaultActiveMilestoneId(milestones, hasResume));
  }, [milestones, hasResume, activeMilestoneId]);

  const activeNode =
    timelineNodes.find((node) =>
      isAdvancedReviewGroup(node)
        ? activeMilestoneId === "advanced_review_group"
        : node.id === activeMilestoneId
    ) ??
    timelineNodes[0] ??
    null;

  if (!activeNode) return null;

  // Compute active node display info
  const activeIsAdvanced = isAdvancedReviewGroup(activeNode);
  const activeStatus = activeIsAdvanced
    ? activeNode.groupedMilestones.every((m) => isMilestoneComplete(m.status))
      ? ("done" as const)
      : activeNode.groupedMilestones.some((m) => m.status === "in_progress" || m.status === "done")
      ? ("in_progress" as const)
      : ("not_started" as const)
    : activeNode.status;

  const activeTitle = activeIsAdvanced
    ? "Advanced Review"
    : displayMilestoneTitle(activeNode);

  const activeSummary = activeIsAdvanced
    ? `${activeNode.groupedMilestones.length} item${activeNode.groupedMilestones.length === 1 ? "" : "s"}`
    : stepSummary(activeNode, hasResume);

  return (
    <div className="space-y-6">
      {/* ── Horizontal stage rail ── */}
      <div className="flex items-start overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {timelineNodes.map((node, index) => {
          const isLast = index === timelineNodes.length - 1;
          const isActive = isAdvancedReviewGroup(node)
            ? activeMilestoneId === "advanced_review_group"
            : node.id === activeMilestoneId;

          const isComplete = isAdvancedReviewGroup(node)
            ? node.groupedMilestones.every((m) => isMilestoneComplete(m.status))
            : isMilestoneComplete(node.status);

          // Skipped = bypassed, visually distinct from done
          const isSkipped = !isAdvancedReviewGroup(node) && node.status === "skipped";
          const isDone = isComplete && !isSkipped;
          const isFailed = !isAdvancedReviewGroup(node) && node.status === "failed";
          const title = railNodeTitle(node);

          const dotClass = cn(
            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer",
            isSkipped
              ? cn(
                  "border-2 border-dashed border-[color:var(--app-muted)]/40 text-[color:var(--app-muted)]",
                  isActive ? "bg-[color:var(--app-surface)] ring-[3px] ring-[color:var(--app-muted)]/15" : "bg-transparent"
                )
              : isDone
              ? "bg-[color:var(--app-brand)] text-white"
              : isActive
              ? "bg-[color:var(--app-brand)] text-white ring-[3px] ring-[color-mix(in_srgb,var(--app-brand)_28%,transparent)]"
              : isFailed
              ? "bg-[color:var(--app-danger)] text-white"
              : "border-2 border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-muted)]"
          );

          return (
            <Fragment key={node.id}>
              {/* Stage node */}
              <div className="flex min-w-[76px] flex-col items-center">
                <button
                  type="button"
                  onClick={() => setActiveMilestoneId(node.id)}
                  className={dotClass}
                  aria-label={`Go to ${title}`}
                >
                  {isSkipped ? (
                    <span>–</span>
                  ) : isDone ? (
                    <CheckIcon />
                  ) : isFailed ? (
                    <span>✕</span>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMilestoneId(node.id)}
                  className="mt-2.5 px-0.5 text-center"
                >
                  <p
                    className={cn(
                      "text-[11px] font-medium leading-tight transition-colors",
                      isActive
                        ? "text-[color:var(--app-heading)]"
                        : isSkipped
                        ? "text-[color:var(--app-muted)] opacity-50"
                        : "text-[color:var(--app-muted)]"
                    )}
                  >
                    {title}
                  </p>
                </button>
              </div>

              {/* Connector line — dashed/muted when the left node was skipped */}
              {!isLast && (
                <div
                  className={cn(
                    "mt-4 h-px flex-1 transition-colors duration-300",
                    isDone ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-border)]"
                  )}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* ── Active stage detail — flat, no outer box ── */}
      <div className="border-t border-[color:var(--app-border)] pt-5">
        <div className="space-y-4">
          {/* Stage header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {!activeIsAdvanced ? (
                  <>
                    <CandidateMilestoneTypePill type={activeNode.type} />
                    {derivedResult(activeNode) ? (
                      <StatusPill
                        label={candidateMilestoneResultLabels[derivedResult(activeNode)!]}
                        tone={resultTone(derivedResult(activeNode))}
                      />
                    ) : null}
                    {!activeIsAdvanced && activeNode.assessment?.status === "in_progress" ? (
                      <CandidateAssessmentPill status={activeNode.assessment.status} />
                    ) : null}
                  </>
                ) : null}
                <CandidateMilestoneStatusPill status={activeStatus} />
              </div>
              <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">{activeTitle}</h3>
              <p className="text-sm text-[color:var(--app-muted)]">{activeSummary}</p>
            </div>
          </div>

          {/* Skipped step notice — shown when the selected step was bypassed */}
          {!activeIsAdvanced && activeStatus === "skipped" ? (
            <div className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-muted)]">
              This step was skipped. Update the status below to re-activate it — earlier steps will stay skipped and the pipeline stage will sync automatically.
            </div>
          ) : null}

          {/* Stage content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.id}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <MilestonePanelContent
                candidateId={candidateId}
                node={activeNode}
                hasResume={hasResume}
                detailHref={detailHref}
                assessmentAddons={assessmentAddons}
                assessmentPresets={assessmentPresets}
                assessmentWorkspaceLabel={assessmentWorkspaceLabel}
                availableInterviewers={availableInterviewers}
                schedulingChannel={schedulingChannel}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
