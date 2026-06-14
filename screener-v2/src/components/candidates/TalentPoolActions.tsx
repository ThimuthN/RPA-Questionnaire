"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";

export function TalentPoolActions({
  candidateId,
  candidateName,
}: {
  candidateId: string;
  candidateName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(orgStatus: "active" | "org_rejected") {
    setBusy(true);
    try {
      await fetch(`/api/candidates/${candidateId}/org-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgStatus }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => void setStatus("active")}
        title={`Reactivate ${candidateName} into the pipeline`}
      >
        Reactivate
      </Button>
    </div>
  );
}
