"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";
import { cn } from "@/lib/utils";

export type NavigatorItemState = "unseen" | "current" | "answered" | "flagged" | "skipped" | "locked";

export interface NavigatorItem {
  id: string;
  label: string;
  state: NavigatorItemState;
  onSelect?: () => void;
}

function itemClass(state: NavigatorItemState) {
  if (state === "current") {
    return "border-[color:var(--app-brand)] bg-[color:var(--app-brand-soft)] text-[color:var(--app-heading)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--app-brand)_22%,transparent)]";
  }
  if (state === "answered") {
    return "border-[color:color-mix(in_srgb,var(--app-success)_35%,transparent)] bg-[color:var(--app-success-soft)] text-[color:var(--app-success)]";
  }
  if (state === "flagged") {
    return "border-[color:color-mix(in_srgb,var(--app-warning)_35%,transparent)] bg-[color:var(--app-warning-soft)] text-[color:var(--app-warning)]";
  }
  if (state === "skipped") {
    return "border-[color:color-mix(in_srgb,var(--app-danger)_35%,transparent)] bg-[color:var(--app-danger-soft)] text-[color:var(--app-danger)]";
  }
  if (state === "locked") {
    return "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)]";
  }
  return "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)] hover:border-[color:color-mix(in_srgb,var(--app-brand)_45%,transparent)]";
}

function ItemIcon({ state }: { state: NavigatorItemState }) {
  if (state === "answered") return <span className="text-[10px] font-semibold">OK</span>;
  if (state === "flagged") return <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />;
  if (state === "skipped") return <span className="h-1.5 w-1.5 rounded-full bg-red-300" />;
  if (state === "locked") return <span className="text-[10px]">.</span>;
  return null;
}

export function NavigatorRail({
  items,
  statusLabel,
  onNextUnanswered,
  answeredCount,
  unansweredCount,
  flaggedCount,
  className
}: {
  items: NavigatorItem[];
  statusLabel: string;
  onNextUnanswered: () => void;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <StagePanel className={cn("space-y-4 p-4", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Navigator</p>
          <span className="text-xs text-[color:var(--app-muted)]">{statusLabel}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <span className="rounded-full border border-[color:color-mix(in_srgb,var(--app-success)_25%,transparent)] bg-[color:var(--app-success-soft)] px-2 py-1 text-center text-[color:var(--app-success)]">
            {answeredCount} done
          </span>
          <span className="rounded-full border border-[color:color-mix(in_srgb,var(--app-danger)_25%,transparent)] bg-[color:var(--app-danger-soft)] px-2 py-1 text-center text-[color:var(--app-danger)]">
            {unansweredCount} left
          </span>
          <span className="rounded-full border border-[color:color-mix(in_srgb,var(--app-warning)_25%,transparent)] bg-[color:var(--app-warning-soft)] px-2 py-1 text-center text-[color:var(--app-warning)]">
            {flaggedCount} flagged
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
          {items.map((item) => {
            const current = item.state === "current";
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={item.onSelect}
                disabled={!item.onSelect}
                className={cn(
                  "relative flex h-11 items-center justify-between rounded-xl border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--app-surface)] disabled:cursor-not-allowed disabled:opacity-70",
                  itemClass(item.state)
                )}
                initial={false}
                animate={current && !reduceMotion ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 0.18 }}
              >
                <span>{item.label}</span>
                <span className="flex items-center justify-center">
                  <ItemIcon state={item.state} />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <Button variant="ghost" className="w-full justify-center" onClick={onNextUnanswered}>
        Next unanswered
      </Button>
    </StagePanel>
  );
}
