"use client";

const defaultStages = [
  "Registered / Applied",
  "Screening",
  "Assessment",
  "Interview",
  "Advanced Review",
  "Finalized"
];

export function DefaultJourneySkeleton({
  hasLinkedApplication
}: {
  hasLinkedApplication: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[color:var(--app-muted)]">
        {!hasLinkedApplication
          ? "Imported/manual candidate — no linked application journey yet."
          : "No tracked milestones yet. Milestones will appear as the candidate moves through the hiring workflow."}
      </p>

      <div className="space-y-2">
        {defaultStages.map((stage, index) => (
          <div
            key={stage}
            className="flex items-center gap-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-xs font-semibold text-[color:var(--app-muted)]">
              {index + 1}
            </div>
            <p className="text-sm text-[color:var(--app-muted)]">{stage}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
