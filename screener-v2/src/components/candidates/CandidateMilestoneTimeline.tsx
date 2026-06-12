"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  CandidateAssessmentPill,
  CandidateMilestoneStatusPill,
  CandidateMilestoneTypePill
} from "@/components/candidates/CandidatePills";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import { TestSubmissionModal } from "@/components/candidates/TestSubmissionModal";
import { InterviewSchedulingModal } from "@/components/candidates/InterviewSchedulingModal";
import {
  candidateMilestoneResultLabels,
  candidateMilestoneStatusLabels,
  candidateMilestoneStatusValues,
  type CandidateMilestoneMode,
  type CandidateMilestoneResult,
  type CheckType
} from "@/lib/candidates/milestones";
import type { CandidateMilestoneRecord } from "@/lib/db/candidates";

type TimelineNode = CandidateMilestoneRecord | { id: string; type: "__advanced_review"; groupedMilestones: CandidateMilestoneRecord[] };

function isAdvancedReviewGroup(node: TimelineNode): node is { id: string; type: "__advanced_review"; groupedMilestones: CandidateMilestoneRecord[] } {
  return node.type === "__advanced_review";
}

function groupMilestonesForTimeline(milestones: CandidateMilestoneRecord[]): TimelineNode[] {
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
  const result: TimelineNode[] = [];
  let advancedMilestones: CandidateMilestoneRecord[] = [];

  for (const m of sorted) {
    if (m.type === "finalized") {
      // Add any accumulated advanced milestones as a group before finalized
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

  // Add any remaining advanced milestones at the end
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
  return nextActionable?.id ?? milestones[0]?.id ?? "advanced_review_group";
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

  if (type === "finalized") {
    return "Finalized notes";
  }

  return "Feedback";
}

function displayMilestoneTitle(milestone: CandidateMilestoneRecord) {
  return milestone.type === "screener" ? "Screening assessment" : milestone.title;
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

  if (milestone.mode === "platform") {
    if (milestone.assessment) {
      if (typeof milestone.assessment.finalPercent === "number") {
        return `${candidateMilestoneResultLabels[derivedResult(milestone) ?? "review"]} | ${milestone.assessment.finalPercent.toFixed(1)} / 100`;
      }
      if (milestone.assessment.status === "invited") {
        return "Assessment assigned.";
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

      {isPlatform && milestone.assessment ? (
        <LinkedAssessmentSummary milestone={milestone} />
      ) : null}
    </div>
  );
}

function CheckBadge({ status }: { status: string }) {
  const tone =
    status === "passed"
      ? ("emerald" as const)
      : status === "failed"
        ? ("red" as const)
        : ("neutral" as const);

  const label =
    status === "passed"
      ? "Approved"
      : status === "failed"
        ? "Rejected"
        : "Pending";

  return <StatusPill tone={tone} label={label} />;
}

function ScreenerMilestoneCard({
  candidateId,
  milestone
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
}) {
  const [isPending, setIsPending] = useState(false);
  const [checkError, setCheckError] = useState("");
  const checks = milestone.checks || [];
  const resumeReviewCheck = checks.find((c) => c.type === "resume_review");
  const screenerTestCheck = checks.find((c) => c.type === "screener_test");
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
      } else {
        const data = await response.json();
        setCheckError(data.message || "Could not update check. Please try again.");
      }
    } catch (error) {
      setCheckError(
        error instanceof Error ? error.message : "Network error. Please check your connection and try again."
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {checkError && (
        <div className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]">
          {checkError}
        </div>
      )}
      <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-[color:var(--app-heading)]">Resume Review</h4>
          {resumeReviewCheck && <CheckBadge status={resumeReviewCheck.status} />}
        </div>
        {resumeReviewCheck?.notes && <p className="text-xs text-[color:var(--app-muted)]">{resumeReviewCheck.notes}</p>}
        {!resumeReviewCheck || resumeReviewCheck.status === "not_started" ? (
          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              onClick={() => handleCheckAction("resume_review", "passed")}
              disabled={isPending}
              variant="secondary"
              className="flex-1"
            >
              {isPending ? "Updating..." : "Approve"}
            </Button>
            <Button
              type="button"
              onClick={() => handleCheckAction("resume_review", "failed")}
              disabled={isPending}
              variant="danger"
              className="flex-1"
            >
              {isPending ? "Updating..." : "Reject"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-[color:var(--app-heading)]">Screening assessment</h4>
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
      <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-[color:var(--app-heading)]">Resume Upload</h4>
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
  node,
  hasResume
}: {
  candidateId: string;
  node: TimelineNode;
  hasResume: boolean;
}) {
  if (isAdvancedReviewGroup(node)) {
    return <AdvancedReviewCard candidateId={candidateId} groupedMilestones={node.groupedMilestones} />;
  }

  const milestone = node;
  if (milestone.type === "registration") {
    return <RegistrationMilestoneCard candidateId={candidateId} milestone={milestone} hasResume={hasResume} />;
  }

  if (milestone.type === "screener") {
    return <ScreenerMilestoneCard candidateId={candidateId} milestone={milestone} />;
  }

  if (milestone.type === "advanced_review" || milestone.type === "review_round") {
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
  groupedMilestones
}: {
  candidateId: string;
  groupedMilestones: CandidateMilestoneRecord[];
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

        // Open the appropriate modal instead of redirecting
        if (type === "advanced_review") {
          setTestModalOpen(true);
        } else {
          setInterviewModalOpen(true);
        }
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
      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestoneId}`, {
        method: "DELETE"
      });

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
      {createError && (
        <div className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]">
          {createError}
        </div>
      )}

      {groupedMilestones.length > 0 ? (
        <div className="space-y-3">
          <div className="px-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)] font-semibold">Current items</p>
          </div>
          {groupedMilestones.map((m) => {
            const result = derivedResult(m);
            const setupHref = `/create-test?candidateId=${candidateId}&milestoneId=${m.id}` as Route;
            const canCreateAssessment = m.mode === "platform" && !m.assessment;
            const handleEdit = () => {
              setEditingMilestoneId(m.id);
              if (m.type === "advanced_review" || m.type === "review_round") {
                setTestModalOpen(true);
              } else if (m.type === "interview") {
                setInterviewModalOpen(true);
              }
            };
            return (
              <div
                key={m.id}
                className="group rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface)]">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex-1 text-left">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <CandidateMilestoneTypePill type={m.type} />
                          <CandidateMilestoneStatusPill status={m.status} />
                        </div>
                        {result && <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[color:var(--app-heading)]">{m.title}</p>
                        <p className="text-xs text-[color:var(--app-muted)] mt-1">{stepSummary(m, false)}</p>
                      </div>
                      {canCreateAssessment ? (
                        <div className="pt-1">
                          <Link href={setupHref}>
                            <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs">
                              Create assessment
                            </Button>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMilestone(m.id, e)}
                    className="rounded p-1.5 opacity-0 group-hover:opacity-100 transition hover:bg-[color:var(--app-danger)]/10"
                    title="Delete milestone"
                    aria-label="Delete milestone">
                    <X className="h-4 w-4 text-[color:var(--app-danger)]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[16px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6 text-center">
          <p className="text-sm text-[color:var(--app-muted)]">No additional assessments or interview notes added yet.</p>
        </div>
      )}

      <div className="space-y-3 border-t border-[color:var(--app-border)] pt-5">
        <div className="px-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)] font-semibold">Add more</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => handleAddMilestone("advanced_review")}
            disabled={isCreatingTest}
            variant="secondary"
            className="flex-1"
          >
            <span>
              {isCreatingTest ? "Creating assessment..." : "Add assessment"}
            </span>
          </Button>
          <Button
            type="button"
            onClick={() => handleAddMilestone("interview")}
            disabled={isCreatingInterview}
            variant="secondary"
            className="flex-1"
          >
            <span>
              {isCreatingInterview ? "Creating interview note..." : "Add interview note"}
            </span>
          </Button>
        </div>
      </div>

      {/* Modals for assessment and interview-note submission/editing */}
      {(pendingMilestoneId || editingMilestoneId) && (
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
            onSuccess={handleModalSuccess}
          />
        </>
      )}
    </div>
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
  const timelineNodes = groupMilestonesForTimeline(milestones);

  const [activeMilestoneId, setActiveMilestoneId] = useState(() =>
    defaultActiveMilestoneId(milestones, hasResume)
  );

  useEffect(() => {
    const exists =
      milestones.some((m) => m.id === activeMilestoneId) || activeMilestoneId === "advanced_review_group";
    if (!exists) {
      setActiveMilestoneId(defaultActiveMilestoneId(milestones, hasResume));
    }
  }, [milestones, hasResume, activeMilestoneId]);

  const activeNode = timelineNodes.find((node) => {
    if (isAdvancedReviewGroup(node)) {
      return activeMilestoneId === "advanced_review_group";
    }
    return node.id === activeMilestoneId;
  }) ?? timelineNodes[0] ?? null;

  if (!activeNode) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 pb-2">
        <div className="space-y-3">
          {timelineNodes.map((node, index) => {
              const isActive =
                isAdvancedReviewGroup(node)
                  ? activeMilestoneId === "advanced_review_group"
                  : node.id === activeMilestoneId;

              let isComplete = false;
              let result: CandidateMilestoneResult | undefined = undefined;
              let status: CandidateMilestoneRecord["status"] = "not_started";
              let title: string = "";
              let summary: string = "";

              if (isAdvancedReviewGroup(node)) {
                title = "Advanced Review";
                const allDone = node.groupedMilestones.every((m) => isMilestoneComplete(m.status));
                const anyDone = node.groupedMilestones.some((m) => isMilestoneComplete(m.status));
                const anyInProgress = node.groupedMilestones.some((m) => m.status === "in_progress");
                isComplete = allDone;
                status = allDone ? "done" : anyInProgress ? "in_progress" : anyDone ? "in_progress" : "not_started";
                summary = `${node.groupedMilestones.length} item${node.groupedMilestones.length === 1 ? "" : "s"}`;
              } else {
                result = derivedResult(node);
                isComplete = isMilestoneComplete(node.status);
                status = node.status;
                title = displayMilestoneTitle(node);
                summary = stepSummary(node, hasResume);
              }

              const nodeState = isComplete ? "complete" : isActive ? "active" : "pending";

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActiveMilestoneId(node.id)}
                  className={`w-full rounded-[16px] border transition text-left p-4 ${isActive ? "border-[color:var(--app-brand)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_8%,var(--app-surface)),color-mix(in_srgb,var(--app-brand)_4%,var(--app-surface-soft)))]" : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] hover:bg-[color:var(--app-surface)]"}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition duration-300 ${timelineNodeClassNames[nodeState]}`}
                    >
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">{title}</p>
                      <p className="text-xs text-[color:var(--app-muted)] mt-1">{summary}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <CandidateMilestoneStatusPill status={status} />
                        {result && !isAdvancedReviewGroup(node) ? (
                          <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      <div className="rounded-[26px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface-soft)_92%,white),color-mix(in_srgb,var(--app-surface)_94%,black))] shadow-[var(--app-shadow-soft)]">
        <div className="p-6 lg:p-7">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  {!isAdvancedReviewGroup(activeNode) && (
                    <>
                      <CandidateMilestoneTypePill type={activeNode.type} />
                      {derivedResult(activeNode) ? (
                        <StatusPill
                          label={candidateMilestoneResultLabels[derivedResult(activeNode) ?? "review"]}
                          tone={resultTone(derivedResult(activeNode))}
                        />
                      ) : null}
                      {activeNode.assessment?.status === "in_progress" ? (
                        <CandidateAssessmentPill status={activeNode.assessment.status} />
                      ) : null}
                    </>
                  )}
                  <CandidateMilestoneStatusPill
                    status={isAdvancedReviewGroup(activeNode)
                      ? (activeNode.groupedMilestones.every(m => m.status === "done" || m.status === "skipped")
                          ? "done"
                          : activeNode.groupedMilestones.some(m => m.status === "in_progress" || m.status === "done")
                          ? "in_progress"
                          : "not_started")
                      : activeNode.status}
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-[color:var(--app-heading)]">
                    {isAdvancedReviewGroup(activeNode) ? "Advanced Review" : displayMilestoneTitle(activeNode)}
                  </h3>
                  <p className="max-w-2xl text-sm text-[color:var(--app-text)] mt-2">
                    {isAdvancedReviewGroup(activeNode)
                      ? `Manage additional assessments and interview notes (${activeNode.groupedMilestones.length} item${activeNode.groupedMilestones.length === 1 ? "" : "s"})`
                      : stepSummary(activeNode, hasResume)}
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeNode.id}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="border-t border-[color:var(--app-border)] pt-5"
              >
                <MilestonePanelContent
                  candidateId={candidateId}
                  node={activeNode}
                  hasResume={hasResume}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

