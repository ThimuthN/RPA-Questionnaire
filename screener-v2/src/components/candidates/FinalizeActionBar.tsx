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
        body: action === "hire" ? JSON.stringify({ createEmployeeRecord: true }) : JSON.stringify({})
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

  return (
    <div className="space-y-2 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[color:var(--app-heading)]">
          {isFinalized ? `Finalized as ${finalizedAs || "closed"}` : "Finalize candidate"}
        </p>
        {!isFinalized ? (
          <p className="text-xs text-[color:var(--app-muted)]">
            Reject finalizes immediately. Hire requires the accepted-offer and passed-assessment checks.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!isFinalized && permissions.includes("hire_candidate") ? (
          <Button type="button" disabled={Boolean(pendingAction)} onClick={() => submit("hire")}>
            {pendingAction === "hire" ? "Hiring..." : "Hire"}
          </Button>
        ) : null}
        {!isFinalized && permissions.includes("manage_candidates") ? (
          <Button type="button" variant="danger" disabled={Boolean(pendingAction)} onClick={() => submit("reject")}>
            {pendingAction === "reject" ? "Rejecting..." : "Reject"}
          </Button>
        ) : null}
        {isFinalized && permissions.includes("manage_users") ? (
          <Button type="button" variant="secondary" disabled={Boolean(pendingAction)} onClick={() => submit("revert")}>
            {pendingAction === "revert" ? "Reverting..." : `Revert ${finalizedAs || "finalized"}`}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}
    </div>
  );
}
