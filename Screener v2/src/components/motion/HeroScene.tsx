"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function HeroScene({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0.3 },
    visible: { pathLength: 1, opacity: 1 }
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-brand-300/20 bg-[radial-gradient(circle_at_top_left,rgba(47,134,255,0.22),transparent_26%),linear-gradient(135deg,rgba(16,39,73,0.92),rgba(5,11,22,0.98))] p-5 shadow-strong",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(138,184,255,0.22),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(18,179,168,0.18),transparent_35%)]" />
      <div className="absolute -left-10 top-6 h-40 w-40 rounded-full border border-white/10" />
      <div className="absolute right-6 top-10 h-24 w-24 rounded-full border border-white/10" />
      <svg viewBox="0 0 320 220" className="relative z-10 h-full w-full">
        <motion.path
          d="M16 170 L70 120 L130 142 L196 86 L250 100 L306 56"
          fill="none"
          stroke="#8ab8ff"
          strokeWidth="2"
          variants={lineVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeOut" }}
        />
        <motion.path
          d="M22 190 L84 156 L138 174 L204 130 L266 136 L300 116"
          fill="none"
          stroke="#12b3a8"
          strokeWidth="1.8"
          variants={lineVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: reduceMotion ? 0 : 0.9, delay: 0.08, ease: "easeOut" }}
        />
        <motion.path
          d="M40 44 C120 16 170 16 276 44"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeDasharray="4 6"
          variants={lineVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: reduceMotion ? 0 : 1.1, delay: 0.12, ease: "easeOut" }}
        />
        <g fill="#ffffff">
          <circle cx="70" cy="120" r="3" />
          <circle cx="196" cy="86" r="3" />
          <circle cx="250" cy="100" r="3" />
        </g>
      </svg>
      <div className="relative z-10 mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-200">
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1">Core: 20m</span>
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1">Practical: 10m</span>
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1">Deterministic</span>
      </div>
    </div>
  );
}
