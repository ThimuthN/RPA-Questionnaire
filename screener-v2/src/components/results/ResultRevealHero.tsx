"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { ResultSummary } from "@/lib/assessment-engine/types";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import { copy } from "@/lib/design/copy";

export function ResultRevealHero({ row }: { row: ResultSummary }) {
  const reduceMotion = useReducedMotion();
  const status = row.pass ? "Pass" : row.borderline ? "Review" : "Fail";
  const tone = row.pass ? "emerald" : row.borderline ? "amber" : "red";
  const score = useMotionValue(reduceMotion ? row.finalPercent : 0);
  const rounded = useTransform(score, (value) => value.toFixed(1));

  useEffect(() => {
    if (reduceMotion) {
      score.set(row.finalPercent);
      return;
    }
    const controls = animate(score, row.finalPercent, {
      duration: 0.8,
      ease: [0.2, 1, 0.2, 1]
    });
    return () => controls.stop();
  }, [reduceMotion, row.finalPercent, score]);

  return (
    <StagePanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(47,134,255,0.16),rgba(255,255,255,0.04))] p-0">
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={status} tone={tone} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl text-white md:text-4xl">{copy.results.finalScore}</h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.runtime.core}</p>
              <p className="mt-2 text-xl text-white">{row.corePercent.toFixed(1)}%</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.runtime.practical}</p>
              <p className="mt-2 text-xl text-white">{row.practicalPercent.toFixed(1)}%</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{copy.results.outcome}</p>
              <p className="mt-2 text-xl text-white">{status}</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 14 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.2, 1, 0.2, 1] }}
          className="relative flex h-[180px] w-[180px] items-center justify-center self-center rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_62%)]"
        >
          <div className="absolute inset-3 rounded-full border border-brand-300/20" />
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <p className="font-display text-5xl text-white">
            <motion.span>{rounded}</motion.span>%
          </p>
        </motion.div>
      </div>
    </StagePanel>
  );
}
