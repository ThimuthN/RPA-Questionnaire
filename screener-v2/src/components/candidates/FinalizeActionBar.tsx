"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";

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
    <div className="space-y-2 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[color:var(--app-heading)]">
          {isFinalized ? `Final decision: ${finalDecisionLabel}` : "Final decision"}
        </p>
        {!isFinalized ? (
          <p className="text-xs text-[color:var(--app-muted)]">
            Mark the final hiring outcome for this candidate.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!isFinalized && permissions.includes("manage_candidates") ? (
          <Button type="button" disabled={Boolean(pendingAction)} onClick={() => submit("hire")}>
            {pendingAction === "hire" ? "Marking as hired..." : "Mark as hired"}
          </Button>
        ) : null}
        {!isFinalized && permissions.includes("manage_candidates") ? (
          <Button type="button" variant="danger" disabled={Boolean(pendingAction)} onClick={() => submit("reject")}>
            {pendingAction === "reject" ? "Marking as rejected..." : "Mark as rejected"}
          </Button>
        ) : null}
        {isFinalized && permissions.includes("manage_candidates") ? (
          <Button type="button" variant="secondary" disabled={Boolean(pendingAction)} onClick={() => submit("revert")}>
            {pendingAction === "revert" ? "Reverting..." : "Revert final decision"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}
    </div>
  );
}
