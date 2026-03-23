"use client";

import { useEffect } from "react";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";

export default function ResultsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Results route crashed", {
      message: error.message,
      digest: error.digest,
      stack: error.stack
    });
  }, [error]);

  return (
    <section className="space-y-4">
      <StagePanel className="space-y-3">
        <h1 className="text-2xl text-white">Results unavailable</h1>
        <p className="text-sm text-slate-300">{error.message || "Something went wrong while loading results."}</p>
        <Button type="button" onClick={reset}>
          Retry
        </Button>
      </StagePanel>
    </section>
  );
}
