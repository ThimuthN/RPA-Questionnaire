"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";

type Recommendation = "strong_yes" | "yes" | "neutral" | "no" | "strong_no";

interface ScorecardData {
  id: string;
  overallRating: number | null;
  recommendation: string | null;
  strengths: string | null;
  concerns: string | null;
  privateNotes: string | null;
  submittedAt: string | null;
  interviewerName: string | null;
}

const recommendations: { value: Recommendation; label: string; tone: "emerald" | "blue" | "neutral" | "amber" | "red" }[] = [
  { value: "strong_yes", label: "Strong yes", tone: "emerald" },
  { value: "yes", label: "Yes", tone: "blue" },
  { value: "neutral", label: "Neutral", tone: "neutral" },
  { value: "no", label: "No", tone: "amber" },
  { value: "strong_no", label: "Strong no", tone: "red" },
];

export function InterviewScorecardModal({
  panelId,
  panelName,
  isOpen,
  onClose,
  onSuccess,
}: {
  panelId: string;
  panelName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [recommendation, setRecommendation] = useState<Recommendation | "">("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [existing, setExisting] = useState<ScorecardData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    void fetch(`/api/interviews/${panelId}/feedback`)
      .then((r) => r.json())
      .then((data: { feedback?: ScorecardData }) => {
        if (data.feedback) {
          setExisting(data.feedback);
          setRating(data.feedback.overallRating ?? 0);
          setRecommendation((data.feedback.recommendation as Recommendation) ?? "");
          setStrengths(data.feedback.strengths ?? "");
          setConcerns(data.feedback.concerns ?? "");
          setPrivateNotes(data.feedback.privateNotes ?? "");
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [isOpen, panelId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/${panelId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overallRating: rating || null, recommendation: recommendation || null, strengths, concerns, privateNotes }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || data.ok === false) throw new Error(data.message ?? "Failed to submit scorecard");
      onSuccess();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4 md:p-6"
          style={{ background: "var(--app-modal-overlay)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
            style={{ background: "var(--app-modal-surface)" }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-6 py-5"
              style={{ background: "var(--app-modal-header)" }}
            >
              <div>
                <h3 className="text-lg text-[color:var(--app-heading)]">Interview scorecard</h3>
                <p className="text-sm text-[color:var(--app-muted)]">{panelName}</p>
              </div>
              <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5" style={{ background: "var(--app-modal-body)" }}>
                {loading ? (
                  <p className="text-sm text-[color:var(--app-muted)]">Loading...</p>
                ) : (
                  <>
                    {existing?.submittedAt ? (
                      <div className="flex items-center gap-2 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2">
                        <StatusPill label="Submitted" tone="emerald" />
                        <span className="text-xs text-[color:var(--app-muted)]">
                          {new Date(existing.submittedAt).toLocaleDateString()} — you can update this scorecard
                        </span>
                      </div>
                    ) : null}

                    {error ? (
                      <p className="rounded-[14px] border border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-soft)] px-3 py-2 text-sm text-[color:var(--app-danger)]">{error}</p>
                    ) : null}

                    {/* Rating */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">Overall rating</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHoverRating(n)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition hover:scale-110"
                            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                          >
                            <Star
                              size={28}
                              className={displayRating >= n ? "fill-amber-400 text-amber-400" : "text-[color:var(--app-border-strong)]"}
                            />
                          </button>
                        ))}
                        {rating > 0 ? (
                          <button type="button" onClick={() => setRating(0)} className="ml-2 text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-danger)]">
                            Clear
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">Recommendation</p>
                      <div className="flex flex-wrap gap-2">
                        {recommendations.map((rec) => (
                          <button
                            key={rec.value}
                            type="button"
                            onClick={() => setRecommendation(recommendation === rec.value ? "" : rec.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              recommendation === rec.value
                                ? "border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white"
                                : "border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] hover:border-[color:var(--app-border-strong)]"
                            }`}
                          >
                            {rec.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Strengths */}
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-[color:var(--app-heading)]">Strengths</span>
                      <textarea
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        rows={3}
                        placeholder="What stood out positively about this candidate?"
                        disabled={isSubmitting}
                        className="min-h-[80px] rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                      />
                    </label>

                    {/* Concerns */}
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-[color:var(--app-heading)]">Concerns</span>
                      <textarea
                        value={concerns}
                        onChange={(e) => setConcerns(e.target.value)}
                        rows={3}
                        placeholder="Any gaps, risks, or flags to surface?"
                        disabled={isSubmitting}
                        className="min-h-[80px] rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                      />
                    </label>

                    {/* Private notes */}
                    <label className="grid gap-1.5">
                      <span className="text-sm font-medium text-[color:var(--app-heading)]">Private notes</span>
                      <p className="text-xs text-[color:var(--app-muted)]">Only visible to you.</p>
                      <textarea
                        value={privateNotes}
                        onChange={(e) => setPrivateNotes(e.target.value)}
                        rows={2}
                        placeholder="Internal notes not shared with the full panel"
                        disabled={isSubmitting}
                        className="min-h-[60px] rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                      />
                    </label>
                  </>
                )}
              </div>

              <div
                className="flex justify-end gap-2 border-t border-[color:var(--app-border)] px-6 py-4"
                style={{ background: "var(--app-modal-footer)" }}
              >
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || loading}>
                  {isSubmitting ? "Submitting..." : existing?.submittedAt ? "Update scorecard" : "Submit scorecard"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
