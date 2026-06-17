"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { RotateCcw, UserCheck, UserX } from "lucide-react";

export function FinalizeActionBar({
  candidateId,
  orgStage,
  finalizedAs,
  permissions
}: {
  candidateId: string;
  orgStage?: string;
  finalizedAs?: string;
  permissions: string[];
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"hire" | "reject" | "revert" | null>(null);
  const [error, setError] = useState("");

  async function submit(action: "hire" | "reject" | "revert") {
    setPendingAction(action);
    setError("");
    const endpoint =
      action === "hire"
        ? `/api/candidates/${candidateId}/hire`
        : action === "reject"
          ? `/api/candidates/${candidateId}/reject`
          : `/api/candidates/${candidateId}/revert-finalization`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || data.error || "Could not update candidate.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update candidate.");
    } finally {
      setPendingAction(null);
    }
  }

  const isFinalized = orgStage === "finalized";
  const finalDecisionLabel =
    finalizedAs === "hired" ? "hired" :
    finalizedAs === "rejected" ? "rejected" :
    "recorded";

  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
            Hiring decision
          </p>
          <p className="text-sm font-semibold text-[color:var(--app-heading)]">
            {isFinalized
              ? finalizedAs === "hired" ? "Marked as hired" : "Not moving forward"
              : "No decision recorded"}
          </p>
          {!isFinalized && (
            <p className="text-xs text-[color:var(--app-muted)]">
              This is final — it closes the candidate&apos;s active hiring journey.
            </p>
          )}
        </div>
        {isFinalized && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            finalizedAs === "hired"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}>
            {finalizedAs === "hired"
              ? <UserCheck className="h-4 w-4" />
              : <UserX className="h-4 w-4" />}
          </div>
        )}
      </div>

      {!isFinalized && permissions.includes("manage_candidates") ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--app-border)] pt-3">
          <button
            type="button"
            disabled={Boolean(pendingAction)}
            onClick={() => submit("hire")}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <UserCheck className="h-3.5 w-3.5" />
            {pendingAction === "hire" ? "Marking…" : "Mark as hired"}
          </button>
          <button
            type="button"
            disabled={Boolean(pendingAction)}
            onClick={() => submit("reject")}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            <UserX className="h-3.5 w-3.5" />
            {pendingAction === "reject" ? "Marking…" : "Not moving forward"}
          </button>
        </div>
      ) : null}

      {isFinalized && permissions.includes("manage_candidates") ? (
        <div className="mt-3 flex items-center border-t border-[color:var(--app-border)] pt-3">
          <Button
            type="button"
            variant="ghost"
            disabled={Boolean(pendingAction)}
            onClick={() => submit("revert")}
            className="gap-1.5 text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
          >
            <RotateCcw className="h-3 w-3" />
            {pendingAction === "revert" ? "Reverting…" : "Revert decision"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-[color:var(--app-danger)]">{error}</p> : null}
    </div>
  );
}
