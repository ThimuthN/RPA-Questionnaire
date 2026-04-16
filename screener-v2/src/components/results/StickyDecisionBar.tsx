"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResultDecisionActions } from "@/components/results/ResultDecisionActions";

interface StickyDecisionBarProps {
  attemptId: string;
  hasLinkedCandidate: boolean;
  nextUnreviewedId?: string;
}

export function StickyDecisionBar({
  attemptId,
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

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 border-t border-[color:var(--app-border)] bg-[color:var(--app-modal-surface-strong)] backdrop-blur-md transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-[color:var(--app-muted)]">Quick decision actions</p>

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
