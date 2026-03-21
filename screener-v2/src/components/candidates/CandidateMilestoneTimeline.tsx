"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  CandidateAssessmentPill,
  CandidateMilestoneModePill,
  CandidateMilestoneStatusPill,
  CandidateMilestoneTypePill
} from "@/components/candidates/CandidatePills";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import {
  candidateMilestoneModeValues,
  candidateMilestoneResultLabels,
  candidateMilestoneStatusLabels,
  candidateMilestoneStatusValues
} from "@/lib/candidates/milestones";
import type { CandidateMilestoneRecord } from "@/lib/db/candidates";

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

function saveButtonLabel(type: CandidateMilestoneRecord["type"], mode: CandidateMilestoneRecord["mode"]) {
  if (type === "screener" || type === "advanced_test") {
    return mode === "platform" ? "Save step" : "Save feedback";
  }

  return "Save";
}

function stepSummary(milestone: CandidateMilestoneRecord, hasResume: boolean) {
  if (milestone.type === "registration") {
    return hasResume ? "Resume attached." : "Resume missing.";
  }

  if (milestone.mode === "platform" && milestone.assessment) {
    if (typeof milestone.assessment.finalPercent === "number") {
      return `${candidateMilestoneResultLabels[derivedResult(milestone) ?? "review"]} • ${milestone.assessment.finalPercent.toFixed(1)} / 100`;
    }
    if (milestone.assessment.status === "invited") {
      return "Test sent.";
    }
    if (milestone.assessment.status === "in_progress") {
      return "Test in progress.";
    }
  }

  if (milestone.result && milestone.result !== "review") {
    return candidateMilestoneResultLabels[milestone.result];
  }

  if (typeof milestone.score === "number") {
    return `Score ${milestone.score}`;
  }

  if (milestone.notes?.trim()) {
    return milestone.notes.trim();
  }

  return milestone.status === "not_started" ? "No updates yet." : candidateMilestoneStatusLabels[milestone.status];
}

function TestMilestoneCard({
  candidateId,
  milestone,
  hasResume
}: {
  candidateId: string;
  milestone: CandidateMilestoneRecord;
  hasResume: boolean;
}) {
  const result = derivedResult(milestone);
  const isPlatform = milestone.mode === "platform";
  const sendHref = `/create-test?candidateId=${candidateId}&milestoneId=${milestone.id}` as Route;
  const resultHref =
    milestone.assessment?.attemptId && typeof milestone.assessment.finalPercent === "number"
      ? (`/results/${milestone.assessment.attemptId}` as Route)
      : null;

  return (
    <div className="space-y-4">
      <form action={`/api/candidates/${candidateId}/milestones/${milestone.id}`} method="post" className="space-y-4">
        <input type="hidden" name="action" value="save" />
        <input type="hidden" name="title" value={milestone.title} />

        <div className="grid gap-2">
          <span className="text-sm text-slate-200">Test path</span>
          <ChoicePills
            name="mode"
            idPrefix={`milestone-mode-${milestone.id}`}
            defaultValue={milestone.mode}
            options={[
              { value: "platform", label: "Through hub" },
              { value: "manual", label: "Outside test" }
            ]}
          />
        </div>

        <div className="grid gap-2">
          <span className="text-sm text-slate-200">Step status</span>
          <ChoicePills
            name="status"
            idPrefix={`milestone-status-${milestone.id}`}
            defaultValue={milestone.status}
            options={candidateMilestoneStatusValues.map((status) => ({
              value: status,
              label: candidateMilestoneStatusLabels[status]
            }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Date</span>
            <input
              name="date"
              type="datetime-local"
              defaultValue={milestone.date ? new Date(milestone.date).toISOString().slice(0, 16) : ""}
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-200">Score</span>
            <input
              name="score"
              type="number"
              step="0.1"
              defaultValue={typeof milestone.score === "number" ? String(milestone.score) : ""}
              placeholder={isPlatform ? "Optional manual override" : "Optional"}
              className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
          </label>
        </div>

        {!isPlatform ? (
          <div className="grid gap-2">
            <span className="text-sm text-slate-200">Pass / fail</span>
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
        ) : (
          <input type="hidden" name="result" value="" />
        )}

        <label className="grid gap-1">
          <span className="text-sm text-slate-200">Feedback</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={milestone.notes || ""}
            className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="submit">{saveButtonLabel(milestone.type, milestone.mode)}</Button>

          {isPlatform && !milestone.assessment ? (
            <Link href={sendHref}>
              <Button type="button" variant="secondary">Create test</Button>
            </Link>
          ) : null}

          {resultHref ? (
            <Link href={resultHref}>
              <Button type="button" variant="secondary">View result</Button>
            </Link>
          ) : null}
        </div>
      </form>

      {isPlatform ? (
        <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
          <div className="space-y-3">
            {milestone.assessment ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <CandidateAssessmentPill status={milestone.assessment.status} />
                  {result ? (
                    <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} />
                  ) : null}
                  {typeof milestone.assessment.finalPercent === "number" ? (
                    <StatusPill label={`${milestone.assessment.finalPercent.toFixed(1)} / 100`} tone="blue" />
                  ) : null}
                </div>
                <p className="text-sm text-slate-300">
                  {milestone.assessment.inviteSlug
                    ? `Linked to hub test ${milestone.assessment.inviteSlug.toUpperCase()}.`
                    : "Linked to a hub test."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm text-white">Link existing test</h4>
                  <p className="text-sm text-slate-300">Use an attempt ID or invite slug.</p>
                </div>

                <form action={`/api/candidates/${candidateId}/milestones/${milestone.id}`} method="post" className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <input type="hidden" name="action" value="link_existing" />
                  <label className="grid gap-1">
                    <span className="text-sm text-slate-200">Attempt ID</span>
                    <input
                      name="attemptId"
                      className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-slate-200">Invite slug</span>
                    <input
                      name="inviteSlug"
                      className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                    />
                  </label>
                  <Button type="submit" variant="secondary">Link existing</Button>
                </form>
              </div>
            )}
          </div>
        </div>
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
    <form action={`/api/candidates/${candidateId}/milestones/${milestone.id}`} method="post" className="space-y-4">
      <input type="hidden" name="action" value="save" />
      <input type="hidden" name="title" value={milestone.title} />
      <input type="hidden" name="mode" value={milestone.mode} />

      <div className="grid gap-2">
        <span className="text-sm text-slate-200">Step status</span>
        <ChoicePills
          name="status"
          idPrefix={`milestone-status-${milestone.id}`}
          defaultValue={milestone.status}
          options={candidateMilestoneStatusValues.map((status) => ({
            value: status,
            label: candidateMilestoneStatusLabels[status]
          }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm text-slate-200">Date</span>
          <input
            name="date"
            type="datetime-local"
            defaultValue={milestone.date ? new Date(milestone.date).toISOString().slice(0, 16) : ""}
            className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm text-slate-200">Pass / fail</span>
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
      </div>

      <label className="grid gap-1">
        <span className="text-sm text-slate-200">{feedbackLabel(milestone.type)}</span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={milestone.notes || ""}
          className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      <Button type="submit">Save</Button>
    </form>
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
    <div className="space-y-4">
      {milestones.map((milestone, index) => {
        const result = derivedResult(milestone);
        const compactByDefault =
          milestone.status === "done" ||
          milestone.status === "skipped" ||
          (milestone.type === "registration" && hasResume);

        return (
          <details key={milestone.id} open={!compactByDefault} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <summary className="list-none cursor-pointer">
              <div className="flex gap-4">
                <div className="hidden pt-1 sm:block">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/14 bg-white/[0.05] text-sm text-slate-200">
                    {index + 1}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <CandidateMilestoneTypePill type={milestone.type} />
                    <CandidateMilestoneStatusPill status={milestone.status} />
                    <CandidateMilestoneModePill mode={milestone.mode} />
                    {result ? <StatusPill label={candidateMilestoneResultLabels[result]} tone={resultTone(result)} /> : null}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg text-white">{milestone.title}</h3>
                    <p className="text-sm text-slate-300">{stepSummary(milestone, hasResume)}</p>
                  </div>
                </div>
              </div>
            </summary>

            <div className="mt-4 border-t border-white/10 pt-4">
              {milestone.type === "registration" ? (
                hasResume ? (
                  <p className="text-sm text-slate-300">Resume is attached.</p>
                ) : (
                  <Link href={`/candidates/${candidateId}#resume` as Route}>
                    <Button type="button" variant="secondary">Add resume</Button>
                  </Link>
                )
              ) : milestone.type === "screener" || milestone.type === "advanced_test" ? (
                <TestMilestoneCard candidateId={candidateId} milestone={milestone} hasResume={hasResume} />
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
