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
        "relative isolate overflow-hidden rounded-[34px] border border-brand-300/20 bg-[radial-gradient(circle_at_20%_18%,rgba(138,184,255,0.22),transparent_22%),radial-gradient(circle_at_80%_22%,rgba(18,179,168,0.16),transparent_18%),radial-gradient(circle_at_68%_72%,rgba(255,196,87,0.12),transparent_18%),linear-gradient(145deg,rgba(16,35,68,0.98),rgba(4,8,18,1))] p-6 shadow-[0_28px_120px_rgba(2,8,23,0.55)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />

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
        transition={{
          duration: reduceMotion ? 0 : 30,
          repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
          ease: "linear"
        }}
      />

      <motion.div
        className="absolute inset-y-0 left-0 w-[48%] bg-[linear-gradient(180deg,rgba(10,16,30,0.96),rgba(4,8,18,0.96))] shadow-[20px_0_60px_rgba(0,0,0,0.35)]"
        initial={reduceMotion ? { opacity: 0 } : { x: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { x: "-88%" }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-[48%] bg-[linear-gradient(180deg,rgba(10,16,30,0.96),rgba(4,8,18,0.96))] shadow-[-20px_0_60px_rgba(0,0,0,0.35)]"
        initial={reduceMotion ? { opacity: 0 } : { x: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { x: "88%" }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="relative z-10 flex h-full min-h-[500px] flex-col justify-between gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand-300">
            Signal chamber
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-200">
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Build</span>
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Run</span>
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1">Review</span>
          </div>
        </div>

        <div className="relative flex-1">
          {[
            ["12%", "18%"],
            ["70%", "16%"],
            ["28%", "78%"],
            ["82%", "72%"],
            ["54%", "42%"]
          ].map(([left, top], index) => (
            <motion.div
              key={`${left}-${top}`}
              className="absolute h-2 w-2 rounded-full bg-brand-200 shadow-[0_0_18px_rgba(138,184,255,0.65)]"
              style={{ left, top }}
              animate={{ opacity: [0.4, 1, 0.5], scale: [1, 1.45, 1] }}
              transition={{
                duration: reduceMotion ? 0 : 2.8 + index * 0.4,
                repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: index * 0.16
              }}
            />
          ))}

          <motion.div
            className="absolute left-[14%] top-[12%] w-[58%] rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_60px_rgba(2,8,23,0.42)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: [0, -5, 0], scale: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.65,
              delay: reduceMotion ? 0 : 0.58,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">Build</p>
                <p className="mt-2 text-2xl text-white">Assessment structure</p>
              </div>
              <span className="rounded-full border border-white/14 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-200">
                ready
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="h-2 rounded-full bg-white/8">
                <motion.div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,#8ab8ff,#12b3a8,#ffcf70)]"
                  initial={{ width: 0 }}
                  animate={{ width: reduceMotion ? "88%" : ["0%", "52%", "88%"] }}
                  transition={{
                    duration: reduceMotion ? 0 : 1.6,
                    delay: reduceMotion ? 0 : 0.82,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {["Core", "Practical", "RCM"].map((label, index) => (
                  <motion.div
                    key={label}
                    className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: [0, index % 2 === 0 ? -3 : 3, 0] }}
                    transition={{
                      opacity: {
                        duration: reduceMotion ? 0 : 0.4,
                        delay: reduceMotion ? 0 : 0.92 + index * 0.08
                      },
                      y: floatTransition(5.8 + index * 0.4, index * 0.08)
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-1 text-sm text-white">active</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute right-[10%] top-[24%] w-[34%] rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(6,12,24,0.94),rgba(12,30,54,0.9))] p-4 shadow-[0_18px_50px_rgba(2,8,23,0.45)] backdrop-blur-xl"
            initial={{ opacity: 0, x: 18, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: [0, 6, 0], scale: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              delay: reduceMotion ? 0 : 1.02,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-amber-200">Review</p>
              <p className="text-xl text-white">Outcome surface</p>
            </div>
            <svg viewBox="0 0 220 120" className="mt-4 h-28 w-full">
              <motion.path
                d="M8 92 L54 68 L100 74 L154 40 L210 20"
                fill="none"
                stroke="#8ab8ff"
                strokeWidth="2.6"
                initial={{ pathLength: 0, opacity: 0.35 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.9,
                  delay: reduceMotion ? 0 : 1.16,
                  ease: "easeOut"
                }}
              />
              <motion.path
                d="M14 102 L60 88 L104 90 L154 80 L208 58"
                fill="none"
                stroke="#12b3a8"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0.2 }}
                animate={{ pathLength: 1, opacity: 0.92 }}
                transition={{
                  duration: reduceMotion ? 0 : 1,
                  delay: reduceMotion ? 0 : 1.22,
                  ease: "easeOut"
                }}
              />
            </svg>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-slate-300">Review signal</span>
              <span className="text-white">ready</span>
            </div>
          </motion.div>

          <motion.div
            className="absolute bottom-[4%] left-[18%] flex items-center gap-3 rounded-full border border-white/12 bg-black/30 px-4 py-3 shadow-[0_10px_30px_rgba(2,8,23,0.42)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: [0, -4, 0] }}
            transition={{
              duration: reduceMotion ? 0 : 0.55,
              delay: reduceMotion ? 0 : 1.26,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.65)]" />
            <span className="text-sm text-white">System live</span>
            <span className="text-sm text-slate-400">Build → Run → Review</span>
          </motion.div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 680" fill="none">
            <motion.path
              d="M170 150 C 300 130, 420 220, 500 250 S 710 330, 812 282"
              stroke="rgba(138,184,255,0.75)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.24 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{
                duration: reduceMotion ? 0 : 1.4,
                delay: reduceMotion ? 0 : 0.92,
                ease: [0.22, 1, 0.36, 1]
              }}
            />
            <motion.path
              d="M290 430 C 420 400, 525 365, 655 422 S 776 520, 852 516"
              stroke="rgba(18,179,168,0.56)"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.18 }}
              animate={{ pathLength: 1, opacity: 0.72 }}
              transition={{
                duration: reduceMotion ? 0 : 1.35,
                delay: reduceMotion ? 0 : 1.08,
                ease: [0.22, 1, 0.36, 1]
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
