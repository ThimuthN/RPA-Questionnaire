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
  kind: string;
};

function buildStages(milestones: Milestone[]): Stage[] {
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
  const stages: Stage[] = [];
  let advGroupAdded = false;

  for (const milestone of sorted) {
    const isAdvancedExtra =
      milestone.type === "advanced_review" &&
      milestone.sortOrder >= 40 &&
      milestone.sortOrder < 9999;

    if (isAdvancedExtra) {
      if (!advGroupAdded) {
        advGroupAdded = true;
        const group = sorted.filter(
          (item) => item.type === "advanced_review" && item.sortOrder >= 40 && item.sortOrder < 9999
        );
        stages.push({
          key: "adv_review_group",
          title: "Review",
          isComplete: group.every((item) => item.status === "done" || item.status === "skipped"),
          isActive: group.some((item) => item.status === "in_progress"),
          isFailed: group.some((item) => item.status === "failed"),
          kind: "advanced_review"
        });
      }
      continue;
    }

    const title =
      milestone.type === "registration"
        ? "Applied"
        : milestone.type === "screener"
          ? "Screening"
          : milestone.type === "finalized"
            ? "Final"
            : milestone.title;

    stages.push({
      key: milestone.id,
      title,
      isComplete: milestone.status === "done" || milestone.status === "skipped",
      isActive: milestone.status === "in_progress",
      isFailed: milestone.status === "failed",
      kind: milestone.type
    });
  }

  return stages;
}

export function CandidatePipelineProgress({
  milestones,
  pipelineHref
}: {
  milestones: Milestone[];
  pipelineHref: Route;
}) {
  if (milestones.length === 0) return null;

  const stages = buildStages(milestones);
  const finalStage = stages.find((stage) => stage.kind === "finalized");
  const hasCompletedFinalStage = Boolean(finalStage?.isComplete);
  const hasPendingEarlierStages = hasCompletedFinalStage
    ? stages.some((stage) => stage.kind !== "finalized" && !stage.isComplete && !stage.isFailed)
    : false;
  const activeStage =
    (hasCompletedFinalStage ? finalStage : null) ??
    stages.find((stage) => stage.isActive) ??
    stages.find((stage) => !stage.isComplete && !stage.isFailed) ??
    null;
  const allComplete = stages.every((stage) => stage.isComplete);

  return (
    <Link
      href={pipelineHref}
      className="group flex items-center gap-4 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-2.5 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface)]"
    >
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
              {!isLast ? (
                <div
                  className={cn(
                    "h-px w-4 transition-colors",
                    stage.isComplete ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-border)]"
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <span className="min-w-0 text-xs">
        {allComplete ? (
          <span className="font-medium text-[color:var(--app-brand)]">Pipeline complete</span>
        ) : activeStage ? (
          <>
            <span className="font-medium text-[color:var(--app-heading)]">{activeStage.title}</span>
            <span className="ml-1.5 text-[color:var(--app-muted)]">
              {hasCompletedFinalStage
                ? "- Finalized"
                : activeStage.isActive
                  ? "- In progress"
                  : "- Up next"}
            </span>
            {hasPendingEarlierStages ? (
              <span
                className="ml-2 inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300"
                title="The final decision is recorded, but earlier milestones still have pending work or incomplete status."
              >
                Pending items
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-[color:var(--app-muted)]">View pipeline</span>
        )}
      </span>

      <span className="ml-auto flex-shrink-0 text-[11px] text-[color:var(--app-muted)] opacity-0 transition group-hover:opacity-100">
        Pipeline {"->"}
      </span>
    </Link>
  );
}
