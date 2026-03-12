"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
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
  if (state === "current") return "border-brand-400 bg-brand-500/18 text-white shadow-[0_0_0_1px_rgba(138,184,255,0.18)]";
  if (state === "answered") return "border-emerald-400/60 bg-emerald-500/12 text-emerald-100";
  if (state === "flagged") return "border-amber-400/60 bg-amber-500/12 text-amber-100";
  if (state === "skipped") return "border-red-400/60 bg-red-500/12 text-red-100";
  if (state === "locked") return "border-white/10 bg-white/[0.04] text-slate-500";
  return "border-white/15 bg-white/[0.05] text-slate-200 hover:border-brand-300/50";
}

function ItemIcon({ state }: { state: NavigatorItemState }) {
  if (state === "answered") return <span className="text-[10px]">✓</span>;
  if (state === "flagged") return <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />;
  if (state === "skipped") return <span className="h-1.5 w-1.5 rounded-full bg-red-300" />;
  if (state === "locked") return <span className="text-[10px]">•</span>;
  return null;
}

export function NavigatorRail({
  items,
  practicalUnlocked,
  onNextUnanswered,
  className
}: {
  items: NavigatorItem[];
  practicalUnlocked: boolean;
  onNextUnanswered: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <StagePanel className={cn("space-y-4 p-4", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Navigator</p>
          <StatusPill label={practicalUnlocked ? "Practical ready" : "Practical locked"} tone={practicalUnlocked ? "teal" : "neutral"} />
        </div>
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
          {items.map((item, index) => {
            const current = item.state === "current";
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={item.onSelect}
                disabled={!item.onSelect}
                className={cn(
                  "relative flex h-11 items-center justify-between rounded-xl border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:cursor-not-allowed disabled:opacity-70",
                  itemClass(item.state)
                )}
                initial={false}
                animate={current && !reduceMotion ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 0.18 }}
              >
                <span>{index + 1}</span>
                <span className="flex items-center justify-center">{<ItemIcon state={item.state} />}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quick actions</p>
          <Button variant="ghost" className="h-auto px-0 py-0 text-xs text-brand-200 hover:bg-transparent" onClick={onNextUnanswered}>
            Next unanswered
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
          <span className="rounded-full border border-white/10 px-2 py-1">N Next</span>
          <span className="rounded-full border border-white/10 px-2 py-1">P Back</span>
          <span className="rounded-full border border-white/10 px-2 py-1">F Flag</span>
          <span className="rounded-full border border-white/10 px-2 py-1">J Toggle</span>
        </div>
      </div>
    </StagePanel>
  );
}
