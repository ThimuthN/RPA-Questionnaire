"use client";

import { useRef } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action="/api/candidates/bulk" method="post">
      <input type="hidden" name="action" value="set_ui_status" />
      <input type="hidden" name="candidateId" value={candidateId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <select
        name="status"
        defaultValue={currentStatus}
        onChange={() => formRef.current?.requestSubmit()}
        className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold outline-none transition ${toneClass[currentStatus] ?? toneClass.in_progress}`}
      >
        {candidateUiStatusValues.map((status) => (
          <option key={status} value={status} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
            {candidateUiStatusLabels[status]}
          </option>
        ))}
      </select>
    </form>
  );
}
