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
        "relative overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-[linear-gradient(90deg,rgba(5,11,22,0.95),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-[linear-gradient(270deg,rgba(5,11,22,0.95),transparent)]" />
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
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(138,184,255,0.55)] system-online-dot" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
