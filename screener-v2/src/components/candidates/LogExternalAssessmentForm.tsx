"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import {
  candidateExternalAssessmentAttachmentAccept,
  candidateExternalAssessmentAttachmentMaxFiles,
  candidateExternalAssessmentAttachmentMaxSizeMB
} from "@/lib/candidates/external-assessment-config";

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "needs_review", label: "Needs review" },
  { value: "pending", label: "Pending" }
] as const;

type FormState = "idle" | "submitting" | "uploading" | "success" | "error";

export function LogExternalAssessmentForm({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [status, setStatus] = useState("completed");
  const [scorePercent, setScorePercent] = useState("");
  const [scoreLabel, setScoreLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  function reset() {
    setTitle("");
    setSourceLabel("");
    setStatus("completed");
    setScorePercent("");
    setScoreLabel("");
    setSummary("");
    setCompletedAt("");
    setFiles([]);
    setError(null);
    setState("idle");
    setExpanded(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Assessment title is required.");
      return;
    }

    setState("submitting");
    setError(null);

    try {
      const res = await fetch(`/api/candidates/${candidateId}/external-assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sourceLabel: sourceLabel.trim() || undefined,
          status,
          scorePercent: scorePercent ? Number(scorePercent) : undefined,
          scoreLabel: scoreLabel.trim() || undefined,
          summary: summary.trim() || undefined,
          completedAt: completedAt || undefined
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create assessment record.");
      }

      const { id: assessmentId } = await res.json();

      if (files.length > 0) {
        setState("uploading");
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          const uploadRes = await fetch(
            `/api/candidates/${candidateId}/external-assessments/${assessmentId}/attachments`,
            { method: "POST", body: fd }
          );
          if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => ({}));
            throw new Error(body.error ?? "Failed to upload attachment.");
          }
        }
      }

      setState("success");
      router.refresh();
      setTimeout(() => reset(), 1500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "An error occurred.");
    }
  }

  const inputClass =
    "w-full rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-[color:var(--app-brand)]/50 focus:bg-[color:var(--app-control-bg-strong)] placeholder:text-[color:var(--app-muted)]/60";

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-[16px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3.5 text-sm font-medium text-[color:var(--app-muted)] transition hover:border-[color:var(--app-brand)]/40 hover:text-[color:var(--app-brand)]"
      >
        <span className="text-base leading-none">+</span>
        Log external assessment
      </button>
    );
  }

  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[color:var(--app-heading)]">
            Log external assessment
          </p>
          <p className="text-xs text-[color:var(--app-muted)]">
            Record an off-platform test, take-home exercise, or external evaluation.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title + source */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
              Assessment title <span className="text-red-400">*</span>
            </label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HackerRank Technical Test"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
              Source / provider
            </label>
            <input
              className={inputClass}
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="e.g. HackerRank, Codility, manual"
            />
          </div>
        </div>

        {/* Status + score */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
              Result
            </label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
              Score (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className={inputClass}
              value={scorePercent}
              onChange={(e) => setScorePercent(e.target.value)}
              placeholder="e.g. 82.5"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
              Score label
            </label>
            <input
              className={inputClass}
              value={scoreLabel}
              onChange={(e) => setScoreLabel(e.target.value)}
              placeholder="e.g. 82.5 / 100"
            />
          </div>
        </div>

        {/* Completion date + summary */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
              Completed on
            </label>
            <input
              type="date"
              className={inputClass}
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
            Notes / summary
          </label>
          <textarea
            rows={3}
            className={`${inputClass} resize-none`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Optional notes about the candidate's performance, feedback, or context."
          />
        </div>

        {/* File attachments */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[color:var(--app-muted)]">
            Attachments
            <span className="ml-1 font-normal">
              (up to {candidateExternalAssessmentAttachmentMaxFiles} files,{" "}
              {candidateExternalAssessmentAttachmentMaxSizeMB} MB each)
            </span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={candidateExternalAssessmentAttachmentAccept}
            className="block w-full text-sm text-[color:var(--app-text)] file:mr-3 file:rounded-full file:border file:border-[color:var(--app-border)] file:bg-[color:var(--app-control-bg)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[color:var(--app-text)] hover:file:bg-[color:var(--app-surface-soft)]"
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              setFiles(selected.slice(0, candidateExternalAssessmentAttachmentMaxFiles));
            }}
          />
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {files.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-1 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-2.5 py-0.5 text-xs text-[color:var(--app-text)]"
                >
                  {f.name}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                    className="ml-0.5 text-[color:var(--app-muted)] hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-[12px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
          <Button type="button" variant="ghost" onClick={reset}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={state === "submitting" || state === "uploading"}
          >
            {state === "uploading"
              ? "Uploading files…"
              : state === "submitting"
                ? "Saving…"
                : state === "success"
                  ? "Saved!"
                  : "Save assessment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
