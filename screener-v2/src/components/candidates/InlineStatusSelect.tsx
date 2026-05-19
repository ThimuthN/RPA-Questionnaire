"use client";

import { useState } from "react";
import { candidateUiStatusLabels, candidateUiStatusValues, type CandidateUiStatus } from "@/lib/candidates/types";

interface InlineStatusSelectProps {
  candidateId: string;
  currentStatus: CandidateUiStatus;
  returnTo: string;
}

const toneClass: Record<CandidateUiStatus, string> = {
  need_review:
    "border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] text-[color:var(--pill-amber-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
  moved_forward:
    "border-[color:var(--pill-emerald-border)] bg-[color:var(--pill-emerald-bg)] text-[color:var(--pill-emerald-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
  rejected:
    "border-[color:var(--pill-red-border)] bg-[color:var(--pill-red-bg)] text-[color:var(--pill-red-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
  in_progress:
    "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)]"
};

export function InlineStatusSelect({ candidateId, currentStatus, returnTo }: InlineStatusSelectProps) {
  const [displayStatus, setDisplayStatus] = useState<CandidateUiStatus>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = async (newStatus: CandidateUiStatus) => {
    if (isSubmitting || newStatus === currentStatus) return;

    setDisplayStatus(newStatus);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("action", "set_ui_status");
      formData.append("candidateId", candidateId);
      formData.append("status", newStatus);
      formData.append("returnTo", returnTo);

      const response = await fetch("/api/candidates/bulk", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Success - reload to get fresh data
      window.location.reload();
    } catch (err) {
      // Revert on error
      setDisplayStatus(currentStatus);
      setIsSubmitting(false);
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <select
      value={displayStatus}
      onChange={(e) => handleChange(e.target.value as CandidateUiStatus)}
      disabled={isSubmitting}
      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold outline-none transition disabled:opacity-50 ${toneClass[displayStatus] ?? toneClass.in_progress}`}
    >
      {candidateUiStatusValues.map((status) => (
        <option key={status} value={status} className="bg-[color:var(--app-control-bg-strong)] text-[color:var(--app-text)]">
          {candidateUiStatusLabels[status]}
        </option>
      ))}
    </select>
  );
}
