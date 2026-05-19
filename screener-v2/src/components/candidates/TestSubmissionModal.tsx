"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import type { CandidateMilestoneMode } from "@/lib/candidates/milestones";

const fieldClassName =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";

interface TestSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  milestoneId: string;
  onSuccess?: () => void;
}

export function TestSubmissionModal({
  isOpen,
  onClose,
  candidateId,
  milestoneId,
  onSuccess
}: TestSubmissionModalProps) {
  const [mode, setMode] = useState<CandidateMilestoneMode>("manual");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    date: "",
    score: "",
    result: "",
    notes: ""
  });

  const isPlatform = mode === "platform";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    try {
      const form = new FormData();
      form.append("action", "save");
      form.append("title", "Test");
      form.append("mode", mode);
      if (formData.date) form.append("date", formData.date);
      if (formData.score) form.append("score", formData.score);
      if (formData.result) form.append("result", formData.result);
      if (formData.notes) form.append("notes", formData.notes);

      const response = await fetch(`/api/candidates/${candidateId}/milestones/${milestoneId}`, {
        method: "POST",
        body: form
      });

      if (response.ok) {
        setFormData({ date: "", score: "", result: "", notes: "" });
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save test");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving test");
    } finally {
      setIsPending(false);
    }
  };

  const createTestHref = `/create-test?candidateId=${candidateId}&milestoneId=${milestoneId}` as Route;

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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Add Test Result</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 transition hover:bg-[color:var(--app-surface-soft)]"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-[color:var(--app-muted)]" />
                </button>
              </div>

              <div className="space-y-5 p-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Test Format</span>
                  <div className="flex gap-2 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-1">
                    {[
                      { value: "platform", label: "In Platform", icon: Zap },
                      { value: "manual", label: "External", icon: BookOpen }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value as CandidateMilestoneMode)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium transition ${
                          mode === value
                            ? "bg-[color:var(--app-brand)] text-white shadow-sm"
                            : "text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {isPlatform ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[16px] border-2 border-dashed border-[color:var(--app-brand)]/40 bg-[color:var(--app-brand)]/5 p-4 space-y-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">Create Platform Test</p>
                      <p className="text-xs text-[color:var(--app-text)]">
                        Use our assessment builder to create a test. Candidates take it on the platform and results are automatically recorded.
                      </p>
                    </div>
                    <Link href={createTestHref}>
                      <Button type="button" className="w-full gap-2">
                        <Zap className="h-4 w-4" />
                        Open Assessment Builder
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <label className="grid gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Date Completed</span>
                      <input
                        type="datetime-local"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className={fieldClassName}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Score</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g., 85.5"
                          value={formData.score}
                          onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                          className={fieldClassName}
                        />
                        <p className="text-xs text-[color:var(--app-muted)]">Optional</p>
                      </label>

                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Result</span>
                        <select
                          value={formData.result}
                          onChange={(e) => setFormData(prev => ({ ...prev, result: e.target.value }))}
                          className={fieldClassName}
                        >
                          <option value="">Not set</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                      </label>
                    </div>

                    <label className="grid gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[color:var(--app-muted)]">Feedback</span>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        placeholder="Test name, platform used, observations, next steps..."
                        className={`${fieldClassName} min-h-[100px] resize-y`}
                      />
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
                          "Save Result"
                        )}
                      </Button>
                    </div>
                  </motion.form>
                )}

                {isPlatform && (
                  <div className="flex gap-3 border-t border-[color:var(--app-border)] pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
