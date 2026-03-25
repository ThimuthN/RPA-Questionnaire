"use client";

import { useRef } from "react";
import { candidateUiStatusLabels, candidateUiStatusValues, type CandidateUiStatus } from "@/lib/candidates/types";

interface InlineStatusSelectProps {
  candidateId: string;
  currentStatus: CandidateUiStatus;
  returnTo: string;
}

const toneClass: Record<CandidateUiStatus, string> = {
  need_review: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  moved_forward: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  rejected: "border-red-400/40 bg-red-500/10 text-red-100",
  in_progress: "border-white/20 bg-white/5 text-slate-200"
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
        className={`rounded-full border px-3 py-1 text-xs font-medium outline-none transition cursor-pointer ${toneClass[currentStatus] ?? toneClass.in_progress}`}
      >
        {candidateUiStatusValues.map((status) => (
          <option key={status} value={status} className="bg-ink-950 text-white">
            {candidateUiStatusLabels[status]}
          </option>
        ))}
      </select>
    </form>
  );
}
