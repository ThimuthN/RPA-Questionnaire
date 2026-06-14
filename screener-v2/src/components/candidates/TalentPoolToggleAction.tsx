"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";

export function TalentPoolToggleAction({
  candidateId,
  candidateName,
  isInPool,
}: {
  candidateId: string;
  candidateName: string;
  isInPool: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/candidates/${candidateId}/org-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgStatus: isInPool ? "active" : "talent_pool" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={busy}
      onClick={() => void toggle()}
      title={isInPool ? `Remove ${candidateName} from talent pool` : `Move ${candidateName} to talent pool`}
    >
      {busy ? "Saving…" : isInPool ? "Remove from pool" : "Add to talent pool"}
    </Button>
  );
}
