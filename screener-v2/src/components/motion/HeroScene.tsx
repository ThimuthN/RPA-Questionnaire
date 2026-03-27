"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HeroScene({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 52, y: 42 });

  const floatTransition = (duration: number, delay = 0) => ({
    duration: reduceMotion ? 0 : duration,
    repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
    delay
  });

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[36px] border border-brand-300/20 bg-[radial-gradient(circle_at_22%_18%,rgba(138,184,255,0.22),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(18,179,168,0.16),transparent_18%),radial-gradient(circle_at_68%_76%,rgba(255,196,87,0.14),transparent_18%),linear-gradient(145deg,rgba(16,35,68,0.98),rgba(4,8,18,1))] p-6 shadow-[0_28px_120px_rgba(2,8,23,0.55)]",
        className
      )}
      onMouseMove={(event) => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100
        });
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-60"
        animate={
          reduceMotion
            ? { background: "radial-gradient(circle at 52% 42%, rgba(138,184,255,0.12), transparent 24%)" }
            : { background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(138,184,255,0.16), transparent 24%)` }
        }
        transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="absolute left-[-14%] top-[-8%] h-64 w-64 rounded-full bg-brand-400/18 blur-3xl"
        animate={{ x: [0, 26], y: [0, 18], scale: [1, 1.08] }}
        transition={floatTransition(8)}
      />
      <motion.div
        className="absolute bottom-[-14%] right-[-8%] h-72 w-72 rounded-full bg-teal-400/12 blur-3xl"
        animate={{ x: [0, -24], y: [0, -18], scale: [1, 1.12] }}
        transition={floatTransition(10, 0.2)}
      />
      <motion.div
        className="absolute left-1/2 top-[14%] h-[56%] w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(138,184,255,0.5),transparent)]"
        animate={{ opacity: [0.3, 0.8, 0.35] }}
        transition={floatTransition(4.8)}
      />

      <motion.div
        className="absolute inset-y-[-4%] left-[-4%] w-[45%] origin-left rounded-r-[36px] border-r border-white/10 bg-[linear-gradient(180deg,rgba(8,13,24,0.92),rgba(4,8,16,0.94))] shadow-[24px_0_60px_rgba(0,0,0,0.34)] backdrop-blur-sm"
        initial={reduceMotion ? { opacity: 0 } : { x: 0, rotate: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { x: "-82%", rotate: -6 }}
        transition={{ duration: reduceMotion ? 0 : 0.95, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-y-[-4%] right-[-4%] w-[45%] origin-right rounded-l-[36px] border-l border-white/10 bg-[linear-gradient(180deg,rgba(8,13,24,0.92),rgba(4,8,16,0.94))] shadow-[-24px_0_60px_rgba(0,0,0,0.34)] backdrop-blur-sm"
        initial={reduceMotion ? { opacity: 0 } : { x: 0, rotate: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { x: "82%", rotate: 6 }}
        transition={{ duration: reduceMotion ? 0 : 0.95, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="relative z-10 flex h-full min-h-[520px] flex-col justify-between gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand-300">
            Inside the flow
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-200">
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Build</span>
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Run</span>
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Review</span>
          </div>
        </div>

        <div className="relative flex-1">
          <motion.div
            className="absolute left-[18%] top-[16%] h-52 w-52 rounded-full border border-white/12 bg-[radial-gradient(circle_at_35%_35%,rgba(138,184,255,0.18),rgba(10,18,32,0.04)_56%,transparent_72%)] shadow-[0_0_120px_rgba(47,134,255,0.18)]"
            animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
            transition={floatTransition(7.6, 0.12)}
          >
            <motion.div
              className="absolute inset-[16%] rounded-full border border-brand-200/20"
              animate={{ rotate: reduceMotion ? 0 : 360 }}
              transition={{ duration: reduceMotion ? 0 : 24, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[31%] rounded-full border border-teal-300/20"
              animate={{ rotate: reduceMotion ? 0 : -360 }}
              transition={{ duration: reduceMotion ? 0 : 18, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_26px_rgba(255,255,255,0.7)]"
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.85] }}
              transition={floatTransition(2.8)}
            />
          </motion.div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 700" fill="none">
            <motion.path
              d="M112 474 C 204 388, 282 318, 398 308 S 620 328, 818 204"
              stroke="rgba(138,184,255,0.82)"
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 0.88 }}
              transition={{ duration: reduceMotion ? 0 : 1.35, delay: reduceMotion ? 0 : 0.92, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.path
              d="M192 206 C 310 188, 382 236, 492 264 S 676 352, 858 346"
              stroke="rgba(18,179,168,0.72)"
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.16 }}
              animate={{ pathLength: 1, opacity: 0.76 }}
              transition={{ duration: reduceMotion ? 0 : 1.4, delay: reduceMotion ? 0 : 1.04, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.path
              d="M382 536 C 496 472, 614 460, 772 520"
              stroke="rgba(255,196,87,0.48)"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.12 }}
              animate={{ pathLength: 1, opacity: 0.52 }}
              transition={{ duration: reduceMotion ? 0 : 1.2, delay: reduceMotion ? 0 : 1.12, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          {[
            { left: "33%", top: "36%", tone: "bg-brand-200/80 shadow-[0_0_18px_rgba(138,184,255,0.72)]", delay: 0 },
            { left: "61%", top: "48%", tone: "bg-teal-300/80 shadow-[0_0_18px_rgba(45,212,191,0.68)]", delay: 0.25 },
            { left: "77%", top: "29%", tone: "bg-cyan-200/85 shadow-[0_0_18px_rgba(111,215,255,0.7)]", delay: 0.42 }
          ].map((node) => (
            <motion.div
              key={`${node.left}-${node.top}`}
              className={cn("absolute h-3 w-3 rounded-full", node.tone)}
              style={{ left: node.left, top: node.top }}
              animate={{ scale: [1, 1.45, 1], opacity: [0.7, 1, 0.76] }}
              transition={floatTransition(2.4 + node.delay, node.delay)}
            >
              <span className="absolute inset-[-9px] rounded-full border border-white/10" />
            </motion.div>
          ))}

          {[
            { left: "16%", top: "64%", label: "Build", tone: "text-brand-100 border-brand-300/25 bg-brand-500/10" },
            { left: "42%", top: "22%", label: "Run", tone: "text-teal-100 border-teal-300/25 bg-teal-500/10" },
            { left: "72%", top: "42%", label: "Review", tone: "text-amber-100 border-amber-300/25 bg-amber-500/10" }
          ].map((chip, index) => (
            <motion.div
              key={chip.label}
              className={cn("absolute rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] shadow-[0_10px_26px_rgba(0,0,0,0.24)] backdrop-blur-xl", chip.tone)}
              style={{ left: chip.left, top: chip.top }}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: [0, index % 2 === 0 ? -4 : 4, 0], scale: 1 }}
              transition={{
                opacity: { duration: reduceMotion ? 0 : 0.36, delay: reduceMotion ? 0 : 1.14 + index * 0.12 },
                y: floatTransition(5.8 + index * 0.6, index * 0.08)
              }}
            >
              {chip.label}
            </motion.div>
          ))}

          <motion.div
            className="absolute right-[10%] top-[20%] max-w-[220px] rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-4 shadow-[0_18px_50px_rgba(2,8,23,0.34)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: [0, 6, 0], scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 1.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Review view</p>
            <p className="mt-3 text-2xl text-white">The important stuff stays in view.</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Less clutter, easier decisions.</p>
          </motion.div>

          <motion.div
            className="absolute bottom-[4%] left-[20%] flex items-center gap-3 rounded-full border border-white/12 bg-black/30 px-4 py-3 shadow-[0_10px_30px_rgba(2,8,23,0.42)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: [0, -4, 0] }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 1.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="system-online-dot h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.65)]" />
            <span className="text-sm text-white">System live</span>
            <span className="text-sm text-slate-400">{"Build -> Run -> Review"}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
