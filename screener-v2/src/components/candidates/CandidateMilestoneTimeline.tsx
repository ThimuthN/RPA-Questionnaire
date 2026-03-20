"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
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
  candidateMilestoneModeLabels,
  candidateMilestoneModeValues,
  candidateMilestoneStatusLabels,
  candidateMilestoneStatusValues
} from "@/lib/candidates/milestones";
import type { CandidateMilestoneRecord } from "@/lib/db/candidates";

function milestoneSummary(milestone: CandidateMilestoneRecord) {
  if (milestone.assessment) {
    if (typeof milestone.assessment.finalPercent === "number") {
      return `${milestone.assessment.finalPercent.toFixed(1)} / 100`;
    }

    switch (milestone.assessment.status) {
      case "invited":
        return "Sent to candidate";
      case "in_progress":
        return "In progress";
      default:
        return undefined;
    }
  }

  if (typeof milestone.score === "number") {
    return `Score ${milestone.score}`;
  }

  if (milestone.notes?.trim()) {
    return milestone.notes.trim();
  }

  return undefined;
}

function nextActionLabel(milestone: CandidateMilestoneRecord, hasResume: boolean) {
  if (milestone.type === "registration" && !hasResume) {
    return "Add resume";
  }

  if (
    (milestone.type === "screener" || milestone.type === "advanced_test") &&
    milestone.mode === "platform" &&
    !milestone.assessment
  ) {
    return hasResume ? "Send test" : "Add resume";
  }

  if (
    (milestone.type === "screener" || milestone.type === "advanced_test") &&
    milestone.assessment?.attemptId &&
    typeof milestone.assessment.finalPercent === "number"
  ) {
    return "View result";
  }

  if (milestone.status === "skipped") {
    return "Skipped";
  }

  if (milestone.status === "done") {
    return "Done";
  }

  return milestone.type === "interview" ? "Add feedback" : "Update";
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
  const [openMilestoneId, setOpenMilestoneId] = useState<string | null>(null);
  const openMilestone = milestones.find((milestone) => milestone.id === openMilestoneId) ?? null;

  return (
    <>
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const summary = milestoneSummary(milestone);
          const action = nextActionLabel(milestone, hasResume);
          const sendHref =
            milestone.type === "screener" || milestone.type === "advanced_test"
              ? (`/create-test?candidateId=${candidateId}&milestoneId=${milestone.id}` as Route)
              : null;
          const resultHref =
            milestone.assessment?.attemptId && typeof milestone.assessment.finalPercent === "number"
              ? (`/results/${milestone.assessment.attemptId}` as Route)
              : null;

          return (
            <div key={milestone.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex gap-4">
                <div className="hidden pt-1 sm:block">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/14 bg-white/[0.05] text-sm text-slate-200">
                    {index + 1}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <CandidateMilestoneTypePill type={milestone.type} />
                        <CandidateMilestoneStatusPill status={milestone.status} />
                        <CandidateMilestoneModePill mode={milestone.mode} />
                        {milestone.assessment ? (
                          <CandidateAssessmentPill status={milestone.assessment.status} />
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg text-white">{milestone.title}</h3>
                        {milestone.date ? (
                          <p className="text-sm text-slate-300">
                            {new Date(milestone.date).toLocaleString()}
                          </p>
                        ) : null}
                        {summary ? <p className="text-sm text-slate-300">{summary}</p> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sendHref && !milestone.assessment && milestone.mode === "platform" ? (
                        <Link href={hasResume ? sendHref : (`/candidates/${candidateId}#resume` as Route)}>
                          <Button>{action}</Button>
                        </Link>
                      ) : null}

                      {resultHref ? (
                        <Link href={resultHref}>
                          <Button variant="secondary">{action}</Button>
                        </Link>
                      ) : null}

                      {!sendHref && !resultHref ? (
                        <Button type="button" variant="secondary" onClick={() => setOpenMilestoneId(milestone.id)}>
                          {action}
                        </Button>
                      ) : null}

                      <Button type="button" variant="ghost" onClick={() => setOpenMilestoneId(milestone.id)}>
                        Edit
                      </Button>
                    </div>
                  </div>

                  {milestone.recommendation ? (
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={milestone.recommendation} tone="neutral" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {openMilestone ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(22,27,40,0.98),rgba(14,19,30,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl text-white">{openMilestone.title}</h3>
                <p className="text-sm text-slate-300">Update this milestone when something happens.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpenMilestoneId(null)}>
                Close
              </Button>
            </div>

            <form
              id={`milestone-save-${openMilestone.id}`}
              action={`/api/candidates/${candidateId}/milestones/${openMilestone.id}`}
              method="post"
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="action" value="save" />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Title</span>
                  <input
                    name="title"
                    defaultValue={openMilestone.title}
                    required
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Date</span>
                  <input
                    name="date"
                    type="datetime-local"
                    defaultValue={
                      openMilestone.date ? new Date(openMilestone.date).toISOString().slice(0, 16) : ""
                    }
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>
              </div>

              <div className="grid gap-2">
                <span className="text-sm text-slate-200">Status</span>
                <ChoicePills
                  name="status"
                  idPrefix={`milestone-status-${openMilestone.id}`}
                  defaultValue={openMilestone.status}
                  options={candidateMilestoneStatusValues.map((status) => ({
                    value: status,
                    label: candidateMilestoneStatusLabels[status]
                  }))}
                />
              </div>

              {(openMilestone.type === "screener" || openMilestone.type === "advanced_test") ? (
                <div className="grid gap-2">
                  <span className="text-sm text-slate-200">Mode</span>
                  <ChoicePills
                    name="mode"
                    idPrefix={`milestone-mode-${openMilestone.id}`}
                    defaultValue={openMilestone.mode}
                    options={candidateMilestoneModeValues.map((mode) => ({
                      value: mode,
                      label: candidateMilestoneModeLabels[mode]
                    }))}
                  />
                </div>
              ) : (
                <input type="hidden" name="mode" value={openMilestone.mode} />
              )}

              {(openMilestone.type === "screener" || openMilestone.type === "advanced_test") ? (
                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Score</span>
                  <input
                    name="score"
                    type="number"
                    step="0.1"
                    defaultValue={typeof openMilestone.score === "number" ? String(openMilestone.score) : ""}
                    placeholder="Optional"
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>
              ) : null}

              <label className="grid gap-1">
                <span className="text-sm text-slate-200">Recommendation</span>
                <input
                  name="recommendation"
                  defaultValue={openMilestone.recommendation || ""}
                  placeholder="Optional"
                  className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-slate-200">Notes</span>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={openMilestone.notes || ""}
                  className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>

              {(openMilestone.type === "screener" || openMilestone.type === "advanced_test") &&
              openMilestone.mode === "platform" ? (
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm text-white">Link existing test</h4>
                      <p className="text-sm text-slate-300">Use an attempt ID or invite slug.</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-sm text-slate-200">Attempt ID</span>
                        <input
                          form={`link-existing-${openMilestone.id}`}
                          name="attemptId"
                          className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        />
                      </label>

                      <label className="grid gap-1">
                        <span className="text-sm text-slate-200">Invite slug</span>
                        <input
                          form={`link-existing-${openMilestone.id}`}
                          name="inviteSlug"
                          className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {openMilestone.assessment ? (
                        <StatusPill label={`Linked ${openMilestone.assessment.inviteSlug.toUpperCase()}`} tone="blue" />
                      ) : null}
                      <Button type="submit" form={`link-existing-${openMilestone.id}`} variant="secondary">
                        Link existing
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {openMilestone.status !== "in_progress" ? (
                    <Button
                      type="submit"
                      form={`milestone-status-in-progress-${openMilestone.id}`}
                      variant="secondary"
                    >
                      Mark in progress
                    </Button>
                  ) : null}
                  {openMilestone.status !== "done" ? (
                    <Button type="submit" form={`milestone-status-done-${openMilestone.id}`}>
                      Complete
                    </Button>
                  ) : null}
                  {openMilestone.status !== "skipped" ? (
                    <Button
                      type="submit"
                      form={`milestone-status-skipped-${openMilestone.id}`}
                      variant="secondary"
                    >
                      Skip
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOpenMilestoneId(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </div>
            </form>

            <form
              id={`milestone-link-${openMilestone.id}`}
              action={`/api/candidates/${candidateId}/milestones/${openMilestone.id}`}
              method="post"
            >
              <input type="hidden" name="action" value="link_existing" />
            </form>

            <form
              id={`milestone-status-in-progress-${openMilestone.id}`}
              action={`/api/candidates/${candidateId}/milestones/${openMilestone.id}`}
              method="post"
            >
              <input type="hidden" name="action" value="status" />
              <input type="hidden" name="status" value="in_progress" />
            </form>

            <form
              id={`milestone-status-done-${openMilestone.id}`}
              action={`/api/candidates/${candidateId}/milestones/${openMilestone.id}`}
              method="post"
            >
              <input type="hidden" name="action" value="status" />
              <input type="hidden" name="status" value="done" />
            </form>

            <form
              id={`milestone-status-skipped-${openMilestone.id}`}
              action={`/api/candidates/${candidateId}/milestones/${openMilestone.id}`}
              method="post"
            >
              <input type="hidden" name="action" value="status" />
              <input type="hidden" name="status" value="skipped" />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
