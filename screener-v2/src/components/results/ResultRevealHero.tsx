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
  const integrityRisk = row.integrity.tabHiddenCount * 2 + row.integrity.copyCount + row.integrity.pasteCount;
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
    <StagePanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(47,134,255,0.12),var(--app-surface)_34%,var(--app-surface-soft))] p-0">
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={status} tone={tone} />
            <StatusPill label={`Pass target ${row.passPercent}%`} tone="neutral" />
            <StatusPill
              label={`Integrity ${integrityRisk >= 6 ? "Review" : integrityRisk >= 2 ? "Watch" : "Clean"}`}
              tone={integrityRisk >= 6 ? "red" : integrityRisk >= 2 ? "amber" : "emerald"}
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl text-[color:var(--app-heading)] md:text-4xl">{copy.results.finalScore}</h1>
            {row.candidateName ? <p className="text-lg text-[color:var(--app-text)]">{row.candidateName}</p> : null}
            {row.candidateEmail ? <p className="text-sm text-[color:var(--app-muted)]">{row.candidateEmail}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
            <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Result status</p>
              <p className="mt-3 text-xl text-[color:var(--app-heading)]">{status}</p>
              <p className="mt-1 text-xs text-[color:var(--app-text)]">
                Final score {row.finalPercent.toFixed(1)} / 100 against a {row.passPercent}% target.
              </p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Integrity signals</p>
              <p className="mt-3 text-xl text-[color:var(--app-heading)]">
                {row.integrity.tabHiddenCount + row.integrity.copyCount + row.integrity.pasteCount}
              </p>
              <p className="mt-1 text-xs text-[color:var(--app-text)]">
                Tabs hidden {row.integrity.tabHiddenCount} | Copy/Cut {row.integrity.copyCount} | Paste {row.integrity.pasteCount}
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 14 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.2, 1, 0.2, 1] }}
          className="relative flex h-[180px] w-[180px] items-center justify-center self-center rounded-full border border-[color:var(--app-border)] bg-[radial-gradient(circle,rgba(47,134,255,0.12),transparent_62%),linear-gradient(180deg,var(--app-surface),var(--app-surface-muted))]"
        >
          <div className="absolute inset-3 rounded-full border border-brand-300/20" />
          <div className="absolute inset-0 rounded-full border border-[color:var(--app-border)]" />
          <div className="text-center">
            <p className="font-display text-5xl text-[color:var(--app-heading)]">
              <motion.span>{rounded}</motion.span>
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">out of 100</p>
          </div>
        </motion.div>
      </div>
    </StagePanel>
  );
}
