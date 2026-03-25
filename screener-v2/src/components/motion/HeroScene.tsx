"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function HeroScene({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

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
        "relative isolate overflow-hidden rounded-[34px] border border-brand-300/20 bg-[radial-gradient(circle_at_18%_18%,rgba(138,184,255,0.24),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(18,179,168,0.16),transparent_22%),radial-gradient(circle_at_72%_68%,rgba(255,196,87,0.14),transparent_20%),linear-gradient(140deg,rgba(18,39,74,0.96),rgba(6,12,24,0.98))] p-6 shadow-[0_28px_120px_rgba(2,8,23,0.55)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:34px_34px] opacity-30" />
      <motion.div
        className="absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full bg-brand-400/18 blur-3xl"
        animate={{ x: [0, 28], y: [0, 18], scale: [1, 1.08] }}
        transition={floatTransition(8)}
      />
      <motion.div
        className="absolute bottom-[-16%] right-[-8%] h-72 w-72 rounded-full bg-teal-400/12 blur-3xl"
        animate={{ x: [0, -24], y: [0, -16], scale: [1, 1.12] }}
        transition={floatTransition(10, 0.2)}
      />
      <motion.div
        className="absolute right-[8%] top-[8%] h-28 w-28 rounded-full border border-white/10"
        animate={{ rotate: reduceMotion ? 0 : 360 }}
        transition={{ duration: reduceMotion ? 0 : 30, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "linear" }}
      />

      <div className="relative z-10 flex h-full min-h-[470px] flex-col justify-between gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand-300">
            Assessment flow
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-200">
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Build</span>
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Invite</span>
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Review</span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
          >
            <h3 className="max-w-md font-display text-[2.15rem] leading-[1.02] text-white sm:text-[2.6rem]">
              Less admin drag.
              <br />
              More signal.
            </h3>
            <p className="max-w-md text-sm leading-7 text-slate-300 sm:text-base">
              A tighter system for composing assessments, inviting participants, and surfacing the right result faster.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <motion.div
                className="rounded-[24px] border border-white/12 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
                animate={{ y: [0, -5, 0] }}
                transition={floatTransition(6, 0.1)}
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Selection</p>
                <p className="mt-2 text-lg text-white">4 add-ons</p>
                <p className="mt-1 text-sm text-slate-300">Balanced at 100/100 with live scoring feedback.</p>
              </motion.div>
              <motion.div
                className="rounded-[24px] border border-white/12 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
                animate={{ y: [0, 6, 0] }}
                transition={floatTransition(7, 0.2)}
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-teal-300">Runtime</p>
                <p className="mt-2 text-lg text-white">Autosave active</p>
                <p className="mt-1 text-sm text-slate-300">Calm progress, lighter chrome, and smarter recovery.</p>
              </motion.div>
            </div>
          </motion.div>

          <div className="relative h-full min-h-[300px]">
            <motion.div
              className="absolute left-[6%] top-[4%] w-[72%] rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_24px_60px_rgba(2,8,23,0.42)] backdrop-blur-xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Builder</p>
                  <p className="mt-1 text-lg text-white">Core 2.0 + BA</p>
                </div>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                  Ready
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm text-white">
                    <span>Assessment mix</span>
                    <span className="text-slate-300">80 min</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/8">
                    <motion.div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#8ab8ff,#12b3a8)]"
                      initial={{ width: 0 }}
                      animate={{ width: reduceMotion ? "100%" : ["0%", "74%", "100%"] }}
                      transition={{ duration: reduceMotion ? 0 : 1.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["Core 2.0", "50/100"],
                    ["Practical", "30/100"],
                    ["BA", "20/100"]
                  ].map(([label, value], index) => (
                    <motion.div
                      key={label}
                      className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: [0, index % 2 === 0 ? -3 : 3, 0] }}
                      transition={{
                        opacity: { duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.2 + index * 0.08 },
                        y: floatTransition(5.5 + index * 0.6, index * 0.1)
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <p className="mt-1 text-sm text-white">{value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute right-[0] top-[24%] w-[56%] rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(6,12,24,0.92),rgba(12,30,54,0.88))] p-4 shadow-[0_18px_50px_rgba(2,8,23,0.45)] backdrop-blur-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0, y: [0, 6, 0] }}
              transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.18 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-amber-200">Review</p>
                  <p className="mt-1 text-base text-white">Result queue</p>
                </div>
                <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100">
                  Needs review
                </span>
              </div>
              <svg viewBox="0 0 220 120" className="mt-4 h-28 w-full">
                <motion.path
                  d="M8 96 L58 64 L102 74 L152 42 L210 18"
                  fill="none"
                  stroke="#8ab8ff"
                  strokeWidth="2.4"
                  initial={{ pathLength: 0, opacity: 0.4 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
                />
                <motion.path
                  d="M12 104 L62 86 L104 92 L154 80 L208 58"
                  fill="none"
                  stroke="#12b3a8"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0.25 }}
                  animate={{ pathLength: 1, opacity: 0.95 }}
                  transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.08, ease: "easeOut" }}
                />
                <g fill="#fff">
                  <circle cx="58" cy="64" r="3.5" />
                  <circle cx="152" cy="42" r="3.5" />
                  <circle cx="210" cy="18" r="3.5" />
                </g>
              </svg>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-300">Strongest area</span>
                <span className="text-white">Data judgment</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-[2%] left-[14%] flex items-center gap-3 rounded-full border border-white/12 bg-black/30 px-4 py-3 shadow-[0_10px_30px_rgba(2,8,23,0.42)] backdrop-blur-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: [0, -4, 0] }}
              transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.28 }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.65)]" />
              <span className="text-sm text-white">Autosave active</span>
              <span className="text-sm text-slate-400">18:46 left</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
