"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import { copy } from "@/lib/design/copy";

export function SectionHandoff({
  pendingCount,
  nextSectionLength,
  currentSectionLabel = "Current section",
  nextSectionLabel = copy.runtime.practical,
  startLabel = copy.runtime.startPractical,
  onStart,
  onBack,
  showBack = true
}: {
  pendingCount: number;
  nextSectionLength: number;
  currentSectionLabel?: string;
  nextSectionLabel?: string;
  startLabel?: string;
  onStart: () => void;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const pendingLabel =
    pendingCount === 0
      ? `${currentSectionLabel} is complete and ready to hand off.`
      : `${currentSectionLabel} still has ${pendingCount} unanswered item${pendingCount === 1 ? "" : "s"}.`;
  const nextLabel = `${nextSectionLabel} has ${nextSectionLength} item${nextSectionLength === 1 ? "" : "s"} waiting.`;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.18),transparent_20%),linear-gradient(180deg,rgba(6,12,24,0.72),rgba(5,11,22,0.88))] p-4">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: [0.2, 1, 0.2, 1] }}
        className="w-full max-w-xl"
      >
        <StagePanel className="overflow-hidden border-teal-400/20 bg-[linear-gradient(180deg,rgba(18,179,168,0.12),rgba(255,255,255,0.05))] p-0">
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusPill label={nextSectionLabel} tone="teal" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl text-white">{startLabel}</h3>
              <p className="max-w-lg text-sm text-slate-200">
                Review your handoff before moving on. You can go back now, or continue when you are ready.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{currentSectionLabel} pending</p>
                <p className="mt-2 text-2xl text-white">{pendingCount}</p>
                <p className="mt-2 text-sm text-slate-300">{pendingLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{nextSectionLabel} items</p>
                <p className="mt-2 text-2xl text-white">{nextSectionLength}</p>
                <p className="mt-2 text-sm text-slate-300">{nextLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onStart}>{startLabel}</Button>
              {showBack && onBack ? (
                <Button variant="secondary" onClick={onBack}>
                  {copy.runtime.back}
                </Button>
              ) : null}
            </div>
          </div>
        </StagePanel>
      </motion.div>
    </div>
  );
}
