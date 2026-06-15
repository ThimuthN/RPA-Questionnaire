"use client";

import { useEffect } from "react";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";

export default function DepartmentsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Departments route crashed", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <section className="space-y-4">
      <StagePanel className="space-y-3">
        <h1 className="text-2xl text-[color:var(--app-heading)]">Workspaces unavailable</h1>
        <p className="text-sm text-[color:var(--app-text)]">
          The workspace list could not be loaded. Refresh the page to try again.
        </p>
        <Button type="button" onClick={reset}>Try again</Button>
      </StagePanel>
    </section>
  );
}
