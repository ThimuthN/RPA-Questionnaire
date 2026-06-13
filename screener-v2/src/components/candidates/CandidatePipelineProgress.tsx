import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Milestone = {
  id: string;
  type: string;
  title: string;
  status: string;
  sortOrder: number;
};

type Stage = {
  key: string;
  title: string;
  isComplete: boolean;
  isActive: boolean;
  isFailed: boolean;
};

function buildStages(milestones: Milestone[]): Stage[] {
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
  const stages: Stage[] = [];
  let advGroupAdded = false;

  for (const m of sorted) {
    const isAdvExtra = m.type === "advanced_review" && m.sortOrder >= 40 && m.sortOrder < 9999;

    if (isAdvExtra) {
      if (!advGroupAdded) {
        advGroupAdded = true;
        const group = sorted.filter(
          (x) => x.type === "advanced_review" && x.sortOrder >= 40 && x.sortOrder < 9999
        );
        stages.push({
          key: "adv_review_group",
          title: "Review",
          isComplete: group.every((x) => x.status === "done" || x.status === "skipped"),
          isActive: group.some((x) => x.status === "in_progress"),
          isFailed: group.some((x) => x.status === "failed"),
        });
      }
    } else {
      const title =
        m.type === "registration" ? "Applied"
        : m.type === "screener" ? "Screening"
        : m.type === "finalized" ? "Final"
        : m.title;

      stages.push({
        key: m.id,
        title,
        isComplete: m.status === "done" || m.status === "skipped",
        isActive: m.status === "in_progress",
        isFailed: m.status === "failed",
      });
    }
  }

  return stages;
}

export function CandidatePipelineProgress({
  milestones,
  pipelineHref,
}: {
  milestones: Milestone[];
  pipelineHref: Route;
}) {
  if (milestones.length === 0) return null;

  const stages = buildStages(milestones);
  const activeStage =
    stages.find((s) => s.isActive) ??
    stages.find((s) => !s.isComplete && !s.isFailed) ??
    null;

  const allComplete = stages.every((s) => s.isComplete);

  return (
    <Link
      href={pipelineHref}
      className="group flex items-center gap-4 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-2.5 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface)]"
    >
      {/* Mini dot rail */}
      <div className="flex flex-shrink-0 items-center">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          return (
            <div key={stage.key} className="flex items-center">
              <div
                className={cn(
                  "h-[9px] w-[9px] rounded-full transition-colors",
                  stage.isComplete && "bg-[color:var(--app-brand)]",
                  stage.isActive &&
                    !stage.isComplete &&
                    "bg-[color:var(--app-brand)] shadow-[0_0_0_2.5px_color-mix(in_srgb,var(--app-brand)_28%,transparent)]",
                  stage.isFailed && "bg-[color:var(--app-danger)]",
                  !stage.isComplete &&
                    !stage.isActive &&
                    !stage.isFailed &&
                    "bg-[color:var(--app-border)]"
                )}
              />
              {!isLast && (
                <div
                  className={cn(
                    "h-px w-4 transition-colors",
                    stage.isComplete ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-border)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage label */}
      <span className="min-w-0 text-xs">
        {allComplete ? (
          <span className="font-medium text-[color:var(--app-brand)]">Pipeline complete</span>
        ) : activeStage ? (
          <>
            <span className="font-medium text-[color:var(--app-heading)]">{activeStage.title}</span>
            <span className="ml-1.5 text-[color:var(--app-muted)]">
              {activeStage.isActive ? "· In progress" : "· Up next"}
            </span>
          </>
        ) : (
          <span className="text-[color:var(--app-muted)]">View pipeline</span>
        )}
      </span>

      {/* View label — appears on hover */}
      <span className="ml-auto flex-shrink-0 text-[11px] text-[color:var(--app-muted)] opacity-0 transition group-hover:opacity-100">
        Pipeline →
      </span>
    </Link>
  );
}
