"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";

const fieldClassName =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";

interface InterviewSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  milestoneId: string;
  onSuccess?: () => void;
}

export function InterviewSchedulingModal({
  isOpen,
  onClose,
  candidateId,
  milestoneId,
  onSuccess
}: InterviewSchedulingModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    date: "",
    result: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    try {
      const form = new FormData();
      form.append("action", "save");
      form.append("title", "Interview");
      form.append("mode", "manual");
      if (formData.date) form.append("date", formData.date);
      if (formData.result) form.append("result", formData.result);
      if (formData.notes) form.append("notes", formData.notes);

      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestoneId}`, {
        method: "POST",
        body: form
      });

      if (response.ok) {
        setFormData({ date: "", result: "", notes: "" });
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save interview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving interview");
    } finally {
      setIsPending(false);
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
            <div className="w-full max-w-md rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[color:var(--app-border)] bg-gradient-to-r from-[color:var(--app-surface)] to-[color:var(--app-surface-soft)] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                    <Calendar className="h-5 w-5 text-brand-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Schedule Interview</h2>
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
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]"
                  >
                    {error}
                  </motion.div>
                )}

                <label className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Date & Time</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className={fieldClassName}
                  />
                  <p className="text-xs text-[color:var(--app-muted)]">When the interview took place or will take place</p>
                </label>

                <div className="grid gap-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Outcome</span>
                  <ChoicePills
                    name="result"
                    idPrefix="interview-result"
                    value={formData.result}
                    onChange={(value) => setFormData(prev => ({ ...prev, result: value }))}
                    options={[
                      { value: "", label: "Not set" },
                      { value: "pass", label: "✓ Pass" },
                      { value: "fail", label: "✗ Fail" },
                      { value: "review", label: "⚠ Review" }
                    ]}
                  />
                </div>

                <label className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[color:var(--app-muted)]" />
                    <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Notes</span>
                  </div>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    placeholder="Feedback, observations, strengths, areas for improvement..."
                    className={`${fieldClassName} min-h-[116px] resize-y`}
                  />
                  <p className="text-xs text-[color:var(--app-muted)]">Optional context for future review</p>
                </label>

                <div className="flex gap-3 border-t border-[color:var(--app-border)] pt-4">
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
                    ) : (
                      "Save Interview"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
