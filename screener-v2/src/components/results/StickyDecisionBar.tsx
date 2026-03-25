"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface StickyDecisionBarProps {
  attemptId: string;
  candidateName: string;
  score: number;
  resultStatus: "pass" | "review" | "fail";
  hasLinkedCandidate: boolean;
  candidateId?: string;
  nextUnreviewedId?: string;
}

export function StickyDecisionBar({
  attemptId,
  candidateName,
  score,
  resultStatus,
  hasLinkedCandidate,
  candidateId,
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
      ? "text-emerald-300"
      : resultStatus === "review"
        ? "text-amber-300"
        : "text-red-300";

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-ink-950/96 backdrop-blur-md transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <p className="text-sm font-medium text-white truncate">{candidateName}</p>
          <span className={`text-sm font-medium ${statusColor}`}>{score.toFixed(1)} / 100</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasLinkedCandidate && (
            <>
              <form action="/api/results/bulk" method="post">
                <input type="hidden" name="returnTo" value={`/results/${attemptId}`} />
                <input type="hidden" name="action" value="set_ui_status" />
                <input type="hidden" name="status" value="moved_forward" />
                <input type="hidden" name="attemptId" value={attemptId} />
                <button
                  type="submit"
                  className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  Move forward
                </button>
              </form>
              <form action="/api/results/bulk" method="post">
                <input type="hidden" name="returnTo" value={`/results/${attemptId}`} />
                <input type="hidden" name="action" value="set_ui_status" />
                <input type="hidden" name="status" value="need_review" />
                <input type="hidden" name="attemptId" value={attemptId} />
                <button
                  type="submit"
                  className="rounded-full border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/25"
                >
                  Keep in review
                </button>
              </form>
              <form action="/api/results/bulk" method="post">
                <input type="hidden" name="returnTo" value={`/results/${attemptId}`} />
                <input type="hidden" name="action" value="set_ui_status" />
                <input type="hidden" name="status" value="rejected" />
                <input type="hidden" name="attemptId" value={attemptId} />
                <button
                  type="submit"
                  className="rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/25"
                >
                  Reject
                </button>
              </form>
            </>
          )}

          {nextUnreviewedId && (
            <Link
              href={`/results/${nextUnreviewedId}`}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-brand-300/60 hover:bg-white/[0.08]"
            >
              Next unreviewed →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
