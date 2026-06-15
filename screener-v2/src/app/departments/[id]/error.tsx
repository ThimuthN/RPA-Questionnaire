"use client";

import { useEffect } from "react";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";

export default function DepartmentError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Department route crashed", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <section className="space-y-4">
      <StagePanel className="space-y-3">
        <h1 className="text-2xl text-[color:var(--app-heading)]">Department unavailable</h1>
        <p className="text-sm text-[color:var(--app-text)]">
          This workspace could not be loaded. Refresh the page or go back and try again.
        </p>
        <Button type="button" onClick={reset}>Try again</Button>
      </StagePanel>
    </section>
  );
}
