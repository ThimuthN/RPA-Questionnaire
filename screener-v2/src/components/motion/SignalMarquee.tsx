"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SignalMarquee({
  items,
  className
}: {
  items: string[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const content = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-[color:var(--app-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface)_96%,white),color-mix(in_srgb,var(--app-surface-soft)_94%,var(--app-bg)))] px-3 py-2 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--app-border)_40%,white)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--app-surface)_98%,var(--app-bg)),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-[linear-gradient(270deg,color-mix(in_srgb,var(--app-surface)_98%,var(--app-bg)),transparent)]" />
      <motion.div
        className="flex min-w-max items-center gap-2 pr-2"
        animate={reduceMotion ? { x: 0 } : { x: ["0%", "-50%"] }}
        transition={{
          duration: reduceMotion ? 0 : 18,
          ease: "linear",
          repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY
        }}
      >
        {content.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[color:var(--app-heading)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(138,184,255,0.55)] system-online-dot" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
