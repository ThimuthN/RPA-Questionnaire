"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock3, Link2, MessageSquare, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import type { CandidateInterviewPanelRecord } from "@/lib/db/candidates";
import type { WorkflowChannelSummary } from "@/lib/integrations/types";

const fieldClassName =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";

interface InterviewSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  milestoneId: string;
  milestone?: { date?: string; result?: string; notes?: string };
  interviewPanel?: CandidateInterviewPanelRecord | null;
  availableInterviewers: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
  schedulingChannel?: WorkflowChannelSummary;
  onSuccess?: () => void;
}

function channelTone(mode?: WorkflowChannelSummary["mode"]) {
  if (mode === "calendar_backed") {
    return "border-emerald-400/20 bg-emerald-500/8 text-emerald-100";
  }
  return "border-amber-400/20 bg-amber-500/8 text-amber-100";
}

function deriveMilestoneStatus(args: {
  scheduledAt: string;
  notes: string;
  result: string;
}) {
  if (args.result === "pass" || args.result === "fail" || args.result === "review") {
    return "done";
  }
  if (args.scheduledAt || args.notes.trim()) {
    return "in_progress";
  }
  return "not_started";
}

export function InterviewSchedulingModal({
  isOpen,
  onClose,
  candidateId,
  milestoneId,
  milestone,
  interviewPanel,
  availableInterviewers,
  schedulingChannel,
  onSuccess
}: InterviewSchedulingModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>(
    interviewPanel?.members.map((member) => member.userId) ?? []
  );
  const [formData, setFormData] = useState({
    date: interviewPanel?.scheduledAt
      ? new Date(interviewPanel.scheduledAt).toISOString().slice(0, 16)
      : milestone?.date
        ? new Date(milestone.date).toISOString().slice(0, 16)
        : "",
    durationMin: String(interviewPanel?.durationMin ?? 60),
    format: interviewPanel?.format || "video",
    meetingUrl: interviewPanel?.meetingUrl || "",
    result: milestone?.result || "",
    notes: milestone?.notes || ""
  });

  const scheduledSummary = interviewPanel?.scheduledAt
    ? new Date(interviewPanel.scheduledAt).toLocaleString()
    : null;
  const hasSavedSetup = Boolean(
    interviewPanel ||
      milestone?.date ||
      milestone?.result ||
      milestone?.notes
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedInterviewerIds(interviewPanel?.members.map((member) => member.userId) ?? []);
    setFormData({
      date: interviewPanel?.scheduledAt
        ? new Date(interviewPanel.scheduledAt).toISOString().slice(0, 16)
        : milestone?.date
          ? new Date(milestone.date).toISOString().slice(0, 16)
          : "",
      durationMin: String(interviewPanel?.durationMin ?? 60),
      format: interviewPanel?.format || "video",
      meetingUrl: interviewPanel?.meetingUrl || "",
      result: milestone?.result || "",
      notes: milestone?.notes || ""
    });
    setError("");
    setShowDeleteConfirm(false);
  }, [isOpen, interviewPanel, milestone]);

  const toggleInterviewer = (userId: string) => {
    setSelectedInterviewerIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    try {
      const form = new FormData();
      form.append("action", "save");
      form.append("title", "Interview");
      form.append("mode", "manual");
      form.append(
        "status",
        deriveMilestoneStatus({
          scheduledAt: formData.date,
          notes: formData.notes,
          result: formData.result
        })
      );
      if (formData.date) {
        form.append("date", formData.date);
      }
      form.append("interviewScheduledAt", formData.date);
      form.append("interviewDurationMin", formData.durationMin);
      form.append("interviewFormat", formData.format);
      if (formData.meetingUrl) {
        form.append("interviewMeetingUrl", formData.meetingUrl);
      }
      form.append("interviewerIdsJson", JSON.stringify(selectedInterviewerIds));
      if (formData.result) {
        form.append("result", formData.result);
      }
      if (formData.notes) {
        form.append("notes", formData.notes);
      }

      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestoneId}`, {
        method: "POST",
        body: form
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || "Failed to save interview");
      }

      setFormData({ date: "", durationMin: "60", format: "video", meetingUrl: "", result: "", notes: "" });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving interview");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestoneId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to remove interview setup");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error removing interview setup");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[color:var(--app-border)] bg-gradient-to-r from-[color:var(--app-surface)] to-[color:var(--app-surface-soft)] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                    <MessageSquare className="h-5 w-5 text-brand-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">
                    {interviewPanel ? "Update interview" : "Schedule interview"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 transition hover:bg-[color:var(--app-surface-soft)]"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-[color:var(--app-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]"
                  >
                    {error}
                  </motion.div>
                ) : null}

                {schedulingChannel ? (
                  <div className={`rounded-[16px] border px-4 py-3 ${channelTone(schedulingChannel.mode)}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{schedulingChannel.label}</p>
                      {schedulingChannel.provider ? (
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-white/75">
                          {schedulingChannel.provider}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-white/70">{schedulingChannel.description}</p>
                    {schedulingChannel.accountLabel || schedulingChannel.resourceLabel ? (
                      <p className="mt-2 text-xs text-white/75">
                        {schedulingChannel.accountLabel ? `Account: ${schedulingChannel.accountLabel}` : null}
                        {schedulingChannel.accountLabel && schedulingChannel.resourceLabel ? " • " : null}
                        {schedulingChannel.resourceLabel ? `Calendar: ${schedulingChannel.resourceLabel}` : null}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <label className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[color:var(--app-muted)]" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                      Interview schedule
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className={fieldClassName}
                  />
                  <p className="text-xs text-[color:var(--app-muted)]">
                    {scheduledSummary
                      ? `Currently scheduled for ${scheduledSummary}.`
                      : "Pick the interview date and time when it is confirmed."}
                  </p>
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-[color:var(--app-muted)]" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                        Duration
                      </span>
                    </div>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={formData.durationMin}
                      onChange={(e) => setFormData((prev) => ({ ...prev, durationMin: e.target.value }))}
                      className={fieldClassName}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                      Format
                    </span>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData((prev) => ({ ...prev, format: e.target.value }))}
                      className={fieldClassName}
                    >
                      <option value="video">Video</option>
                      <option value="phone">Phone</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </label>
                </div>

                {formData.format === "video" ? (
                  <label className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-[color:var(--app-muted)]" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                        Meeting link
                      </span>
                    </div>
                    <input
                      type="url"
                      value={formData.meetingUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, meetingUrl: e.target.value }))}
                      placeholder="https://teams.microsoft.com/…"
                      className={fieldClassName}
                    />
                    <p className="text-xs text-[color:var(--app-muted)]">
                      Paste a Teams, Zoom, or Google Meet link — optional
                    </p>
                  </label>
                ) : null}

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[color:var(--app-muted)]" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                      Interviewers
                    </span>
                  </div>
                  {availableInterviewers.length > 0 ? (
                    <div className="space-y-2 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3">
                      {availableInterviewers.map((user) => {
                        const checked = selectedInterviewerIds.includes(user.id);
                        return (
                          <label
                            key={user.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-[14px] px-3 py-2 transition ${
                              checked
                                ? "bg-[color:var(--app-brand)]/10"
                                : "hover:bg-[color:var(--app-surface)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleInterviewer(user.id)}
                              className="mt-1"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm text-[color:var(--app-heading)]">
                                {user.name || user.email}
                              </span>
                              <span className="block truncate text-xs text-[color:var(--app-muted)]">
                                {user.email}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-muted)]">
                      No responsible team members are assigned yet. Apply a hiring-team template first, then schedule the interview.
                    </div>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                    Outcome
                  </span>
                  <ChoicePills
                    name="result"
                    idPrefix="interview-result"
                    value={formData.result}
                    onChange={(value) => setFormData((prev) => ({ ...prev, result: value }))}
                    options={[
                      { value: "", label: "Not set" },
                      { value: "pass", label: "Pass" },
                      { value: "fail", label: "Fail" },
                      { value: "review", label: "Review" }
                    ]}
                  />
                </div>

                <label className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[color:var(--app-muted)]" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                      Notes
                    </span>
                  </div>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    placeholder="Interview brief, focus areas, risks, or follow-up..."
                    className={`${fieldClassName} min-h-[116px] resize-y`}
                  />
                  <p className="text-xs text-[color:var(--app-muted)]">Optional context for the hiring decision</p>
                </label>

                <div className="flex gap-3 border-t border-[color:var(--app-border)] pt-4">
                  {showDeleteConfirm ? (
                    <>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="flex-1"
                      >
                        {isDeleting ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Deleting...
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {hasSavedSetup ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex-1 gap-2 text-[color:var(--app-danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="flex-1"
                      >
                        {isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                          </span>
                        ) : interviewPanel ? (
                          "Update interview"
                        ) : (
                          "Save schedule"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
