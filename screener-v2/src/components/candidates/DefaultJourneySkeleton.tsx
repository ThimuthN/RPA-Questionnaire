"use client";

import { useState } from "react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { cn } from "@/lib/utils";

const defaultStages = [
  {
    id: "registered",
    title: "Registered / Applied",
    summary: "Intake and application context",
    detail: "Use this stage to confirm intake basics before any workflow progression."
  },
  {
    id: "screening",
    title: "Screening assessment",
    summary: "Resume review and screening evidence",
    detail: "Use this stage for resume review and the first screening decision."
  },
  {
    id: "interview",
    title: "Interview",
    summary: "Scheduling, feedback, and signals",
    detail: "Interview rounds should remain empty until real notes or outcomes exist."
  },
  {
    id: "advanced-review",
    title: "Advanced Review",
    summary: "Panel review and calibration",
    detail: "Use this step for the review work between interview and final decision."
  },
  {
    id: "finalized",
    title: "Finalized",
    summary: "Final decision recorded",
    detail: "No completion state is shown here until the persisted result says it is finalized."
  }
] as const;

function connectorClassName(index: number) {
  return index === defaultStages.length - 1
    ? "hidden"
    : "absolute left-[calc(50%+1.75rem)] top-[1.75rem] hidden h-px w-[calc(100%-3.5rem)] bg-[color:var(--app-border)] lg:block";
}

export function DefaultJourneySkeleton({
  hasHiringJourney
}: {
  hasHiringJourney: boolean;
}) {
  const [activeStageId, setActiveStageId] = useState<(typeof defaultStages)[number]["id"]>(defaultStages[0].id);
  const activeStage = defaultStages.find((stage) => stage.id === activeStageId) ?? defaultStages[0];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-[color:var(--app-muted)]">
          {hasHiringJourney
            ? "No tracked milestones yet. Progress will appear as this candidate moves through review."
            : "No active hiring journey yet. Progress appears after this candidate is connected to a workspace hiring flow."}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {defaultStages.map((stage, index) => {
          const isActive = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageId(stage.id)}
              className={cn(
                "relative rounded-[18px] border px-4 py-4 text-left transition",
                isActive
                  ? "border-[color:var(--app-brand)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_8%,var(--app-surface)),color-mix(in_srgb,var(--app-brand)_4%,var(--app-surface-soft)))]"
                  : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] hover:bg-[color:var(--app-surface)]"
              )}
            >
              <span className={connectorClassName(index)} />
              <div className="space-y-3">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold",
                    isActive
                      ? "border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_16px_28px_color-mix(in_srgb,var(--app-brand)_24%,transparent)]"
                      : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-muted)]"
                  )}
                >
                  {index + 1}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{stage.title}</p>
                  <p className="text-xs leading-5 text-[color:var(--app-muted)]">{stage.summary}</p>
                  <StatusPill label={isActive ? "In review" : "Pending"} tone={isActive ? "blue" : "neutral"} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 shadow-[var(--app-shadow-soft)]">
        <div className="flex flex-wrap gap-2">
          <StatusPill label={activeStage.title} tone="neutral" />
          <StatusPill label="Pending setup" tone="amber" />
        </div>
        <div className="mt-4 space-y-2">
          <h3 className="text-xl text-[color:var(--app-heading)]">{activeStage.title}</h3>
          <p className="text-sm leading-6 text-[color:var(--app-text)]">{activeStage.detail}</p>
          {!hasHiringJourney ? (
            <p className="text-sm text-amber-300">
              Connect this candidate to a department hiring journey before expecting workflow progress here.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
