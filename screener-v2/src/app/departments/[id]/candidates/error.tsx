"use client";

import { useEffect } from "react";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";

export default function DepartmentCandidatesError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Department candidates route crashed", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <section className="space-y-4">
      <StagePanel className="space-y-3">
        <h1 className="text-2xl text-[color:var(--app-heading)]">Candidate list unavailable</h1>
        <p className="text-sm text-[color:var(--app-text)]">
          The candidate list could not be loaded. Try refreshing the page or adjusting your filters.
        </p>
        <Button type="button" onClick={reset}>Try again</Button>
      </StagePanel>
    </section>
  );
}
