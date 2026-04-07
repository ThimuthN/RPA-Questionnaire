"use client";

import { useState } from "react";
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
  type CandidateMilestoneMode
} from "@/lib/candidates/milestones";
import type { CandidateMilestoneRecord } from "@/lib/db/candidates";

const fieldClassName =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";

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
  if (type === "screener" || type === "advanced_test") {
    return mode === "platform" ? "Save changes" : "Save notes";
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

    return "No assessment linked yet.";
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
    <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <CandidateAssessmentPill status={milestone.assessment.status} />
          {result ? (
            <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />
          ) : null}
          {typeof milestone.assessment.finalPercent === "number" ? (
            <StatusPill label={`${milestone.assessment.finalPercent.toFixed(1)} / 100`} tone="blue" />
          ) : null}
        </div>

        <p className="text-sm text-[color:var(--app-text)]">
          {milestone.assessment.inviteSlug
            ? `Linked to ${milestone.assessment.inviteSlug.toUpperCase()}.`
            : "Linked to an assessment."}
        </p>

        <div className="grid gap-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Invite code</p>
            <p className="text-sm text-[color:var(--app-heading)]">{inviteCode || "Not available"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Created</p>
            <p className="text-sm text-[color:var(--app-heading)]">{new Date(milestone.assessment.createdAt).toLocaleString()}</p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Share path</p>
            <p className="break-all text-sm text-[color:var(--app-text)]">
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
    <form
      action={`/api/candidates/${candidateId}/milestones/${milestoneId}`}
      method="post"
      className="grid gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
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
        Link assessment
      </Button>
    </form>
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
          <StatusPill label={selectedMode === "platform" ? "In-platform assessment" : "External assessment"} tone="neutral" />
          {milestone.date ? (
            <StatusPill label={new Date(milestone.date).toLocaleDateString()} tone="neutral" />
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Assessment type</span>
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
          options={[
            { value: "", label: "Not set" },
            { value: "pass", label: "Pass" },
            { value: "fail", label: "Fail" }
          ]}
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
  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-6 left-4 top-4 hidden w-px bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--app-brand)_28%,transparent),color-mix(in_srgb,var(--app-border)_88%,transparent),transparent)] sm:block" />
      {milestones.map((milestone, index) => {
        const result = derivedResult(milestone);
        const hasActivity = Boolean(
          milestone.assessment ||
            milestone.notes?.trim() ||
            milestone.date ||
            typeof milestone.score === "number" ||
            result
        );
        const compactByDefault =
          milestone.status !== "in_progress" &&
          (milestone.status === "done" ||
            milestone.status === "skipped" ||
            (milestone.status === "not_started" && !hasActivity) ||
            (milestone.type === "registration" && hasResume));

        return (
          <details
            key={milestone.id}
            open={!compactByDefault}
            className="group relative ml-0 border-t border-[color:var(--app-border)] py-4 first:border-t-0 sm:pl-14"
          >
            <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
              <div className="flex items-start gap-3">
                <div className="hidden sm:block">
                  <div className="absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-brand)_18%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_94%,white))] text-sm text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]">
                    {index + 1}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap gap-2">
                        <CandidateMilestoneTypePill type={milestone.type} />
                        <CandidateMilestoneStatusPill status={milestone.status} />
                        {result ? (
                          <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />
                        ) : null}
                        {milestone.assessment?.status === "in_progress" ? (
                          <CandidateAssessmentPill status={milestone.assessment.status} />
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg text-[color:var(--app-heading)]">{milestone.title}</h3>
                        <p className="text-sm text-[color:var(--app-text)]">{stepSummary(milestone, hasResume)}</p>
                      </div>
                    </div>

                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)] transition duration-200 group-open:rotate-180">
                      <ChevronIcon />
                    </span>
                  </div>
                </div>
              </div>
            </summary>

            <div className="mt-4 rounded-[24px] bg-[color:var(--app-surface-soft)] p-4 ring-1 ring-[color:var(--app-border)]">
              {milestone.type === "registration" ? (
                hasResume ? (
                  <p className="text-sm text-[color:var(--app-text)]">Resume attached.</p>
                ) : (
                  <Link href={`/candidates/${candidateId}#resume` as Route}>
                    <Button type="button" variant="secondary">
                      Add resume
                    </Button>
                  </Link>
                )
              ) : milestone.type === "screener" || milestone.type === "advanced_test" ? (
                <TestMilestoneCard candidateId={candidateId} milestone={milestone} />
              ) : (
                <DocumentationMilestoneCard candidateId={candidateId} milestone={milestone} />
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
