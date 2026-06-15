"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Response = {
  questionKey: string;
  questionLabel: string;
  formatLabel: string;
  answerText: string | null;
  pointsEarned: number;
  pointsPossible: number;
};

export function ScreeningResponsesDisclosure({
  responses,
}: {
  responses: Response[];
}) {
  const [open, setOpen] = useState(false);

  if (responses.length === 0) return null;

  return (
    <div className="border-t border-[color:var(--app-border)] pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-medium text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)] transition-colors">
          {open ? "Hide" : "View"} {responses.length} response{responses.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-[color:var(--app-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {responses.map((response) => (
            <div
              key={response.questionKey}
              className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-[color:var(--app-heading)] leading-snug">
                    {response.questionLabel}
                  </p>
                  <p className="text-[11px] text-[color:var(--app-muted)]">{response.formatLabel}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-[color:var(--app-muted)]">
                  {response.pointsEarned}&thinsp;/&thinsp;{response.pointsPossible}
                </span>
              </div>
              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-6 text-[color:var(--app-text)]">
                {response.answerText || <span className="italic text-[color:var(--app-muted)]">No answer submitted</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
