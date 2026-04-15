"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResultDecisionActions } from "@/components/results/ResultDecisionActions";

interface StickyDecisionBarProps {
  attemptId: string;
  candidateName: string;
  score: number;
  resultStatus: "pass" | "review" | "fail";
  hasLinkedCandidate: boolean;
  nextUnreviewedId?: string;
}

export function StickyDecisionBar({
  attemptId,
  candidateName,
  score,
  resultStatus,
  hasLinkedCandidate,
  nextUnreviewedId
}: StickyDecisionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 280);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const statusColor =
    resultStatus === "pass"
      ? "text-[color:var(--app-success)]"
      : resultStatus === "review"
        ? "text-[color:var(--app-warning)]"
        : "text-[color:var(--app-danger)]";

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 border-t border-[color:var(--app-border)] bg-[color:var(--app-modal-surface-strong)] backdrop-blur-md transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <p className="text-sm font-medium text-[color:var(--app-heading)] truncate">{candidateName}</p>
          <span className={`text-sm font-medium ${statusColor}`}>{score.toFixed(1)} / 100</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasLinkedCandidate && (
            <ResultDecisionActions
              attemptId={attemptId}
              renderAction={(action) => (
                <button type="submit" className={action.barButtonClassName}>
                  {action.label}
                </button>
              )}
            />
          )}

          {nextUnreviewedId && (
            <Link
              href={`/results/${nextUnreviewedId}`}
              className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2 text-sm text-[color:var(--app-text)] transition hover:border-brand-300/60 hover:bg-[color:var(--app-surface-soft)]"
            >
              Next unreviewed -&gt;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
