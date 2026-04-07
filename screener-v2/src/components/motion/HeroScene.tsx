"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type FlowStage = {
  id: "build" | "run" | "review";
  label: string;
  kicker: string;
  title: string;
  body: string;
  callout: string;
  chips: [string, string];
  metrics: [string, string];
  node: { left: string; top: string };
  caption: string;
};

const FLOW_STAGES: FlowStage[] = [
  {
    id: "build",
    label: "Build",
    kicker: "Design the signal",
    title: "Shape the assessment around the role, not around admin work.",
    body: "Choose the sections, pacing, and pass target up front so the screener starts with structure instead of guesswork.",
    callout: "Create a clean blueprint in minutes.",
    chips: ["Role-based setup", "Pass targets visible"],
    metrics: ["Structure first", "Ready to share"],
    node: { left: "23%", top: "64%" },
    caption: "Blueprint"
  },
  {
    id: "run",
    label: "Run",
    kicker: "Keep the runtime calm",
    title: "Give candidates a focused flow that feels clear from start to finish.",
    body: "The system keeps timing, navigation, and autosave working quietly in the background so attention stays on the work.",
    callout: "The experience stays fast, steady, and easy to follow.",
    chips: ["Autosave active", "Navigation stays simple"],
    metrics: ["Low friction", "Live progress"],
    node: { left: "48%", top: "34%" },
    caption: "Runtime"
  },
  {
    id: "review",
    label: "Review",
    kicker: "Turn answers into decisions",
    title: "Bring scores, flags, and judgment into one review-ready view.",
    body: "When submissions come in, the important signals surface quickly so reviewers can see what matters without digging around.",
    callout: "Move from finished attempt to confident decision faster.",
    chips: ["Signals surfaced", "Results easy to scan"],
    metrics: ["Faster review", "Clear outcome"],
    node: { left: "78%", top: "52%" },
    caption: "Decision"
  }
];

const STAGE_BADGE_CLASS: Record<FlowStage["id"], string> = {
  build: "border-brand-300/25 bg-brand-400/12 text-brand-100",
  run: "border-teal-300/25 bg-teal-400/12 text-teal-50",
  review: "border-amber-300/25 bg-amber-300/12 text-amber-50"
};

const STAGE_NODE_CLASS: Record<FlowStage["id"], string> = {
  build: "bg-brand-200 shadow-[0_0_24px_rgba(138,184,255,0.7)]",
  run: "bg-teal-200 shadow-[0_0_24px_rgba(94,234,212,0.65)]",
  review: "bg-amber-200 shadow-[0_0_24px_rgba(252,211,77,0.65)]"
};

const STAGE_PANEL_CLASS: Record<FlowStage["id"], string> = {
  build: "border-brand-300/20 bg-brand-400/10 text-brand-100",
  run: "border-teal-300/20 bg-teal-400/10 text-teal-50",
  review: "border-amber-300/20 bg-amber-300/10 text-amber-50"
};

export function HeroScene({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 54, y: 42 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeStage = FLOW_STAGES[activeIndex];

  useEffect(() => {
    if (reduceMotion || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FLOW_STAGES.length);
    }, 3800);

    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion]);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_18%_18%,rgba(138,184,255,0.24),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(18,179,168,0.14),transparent_24%),linear-gradient(180deg,rgba(11,24,46,0.98),rgba(5,11,22,1))] p-6 shadow-[0_28px_120px_rgba(2,8,23,0.45)]",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onMouseMove={(event) => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100
        });
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

      <motion.div
        className="pointer-events-none absolute inset-0 opacity-80"
        animate={
          reduceMotion
            ? { background: "radial-gradient(circle at 54% 42%, rgba(138,184,255,0.14), transparent 28%)" }
            : { background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(138,184,255,0.18), transparent 28%)` }
        }
        transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="absolute left-[8%] top-[14%] h-48 w-48 rounded-full border border-brand-300/12 bg-brand-400/10 blur-2xl"
        animate={reduceMotion ? { opacity: 0.6 } : { opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}
        transition={{ duration: reduceMotion ? 0 : 6.5, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[8%] h-52 w-52 rounded-full border border-teal-300/10 bg-teal-400/10 blur-2xl"
        animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: reduceMotion ? 0 : 7.2, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-[520px] flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-full border border-brand-300/20 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-brand-200">
            Assessment flow
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.22em] text-slate-400">Build. Run. Review.</div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative flex min-h-[340px] items-center justify-center">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 700" fill="none" aria-hidden="true">
              <motion.path
                d="M180 530 C 330 380, 470 300, 640 312 S 820 392, 860 470"
                stroke="rgba(138,184,255,0.26)"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.2 }}
                animate={{ pathLength: 1, opacity: activeStage.id === "build" ? 0.95 : 0.55 }}
                transition={{ duration: reduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.path
                d="M220 220 C 350 210, 430 260, 510 330 S 690 480, 806 450"
                stroke="rgba(18,179,168,0.22)"
                strokeWidth="1.3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.12 }}
                animate={{ pathLength: 1, opacity: activeStage.id === "run" ? 0.92 : 0.5 }}
                transition={{ duration: reduceMotion ? 0 : 1.35, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.path
                d="M514 146 C 610 170, 680 242, 708 336 S 710 518, 624 588"
                stroke="rgba(252,211,77,0.16)"
                strokeWidth="1.3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.1 }}
                animate={{ pathLength: 1, opacity: activeStage.id === "review" ? 0.88 : 0.42 }}
                transition={{ duration: reduceMotion ? 0 : 1.25, delay: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>

            <motion.div
              className="relative h-[320px] w-[320px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(138,184,255,0.10),rgba(138,184,255,0.03)_44%,transparent_72%)]"
              animate={
                reduceMotion
                  ? { scale: 1, rotate: 0 }
                  : { scale: [1, 1.03, 1], opacity: [0.8, 1, 0.84], rotate: [0, 6, 0] }
              }
              transition={{ duration: reduceMotion ? 0 : 5.2, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <div className="absolute inset-[14%] rounded-full border border-brand-300/16" />
              <div className="absolute inset-[28%] rounded-full border border-teal-300/12" />
              <div className="absolute inset-[42%] rounded-full border border-white/10" />

              <div className="absolute inset-[30%] grid place-items-center">
                <motion.div
                  className={cn(
                    "rounded-[26px] border px-5 py-4 text-center shadow-[0_18px_44px_rgba(2,8,23,0.28)] backdrop-blur-xl",
                    STAGE_PANEL_CLASS[activeStage.id]
                  )}
                  key={activeStage.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/65">{activeStage.kicker}</p>
                  <p className="mt-2 font-display text-2xl text-white">{activeStage.label}</p>
                  <p className="mt-2 max-w-[10rem] text-xs leading-6 text-white/72">{activeStage.callout}</p>
                </motion.div>
              </div>
            </motion.div>

            {FLOW_STAGES.map((stage, index) => {
              const isActive = stage.id === activeStage.id;

              return (
                <div key={stage.id}>
                  <motion.div
                    className={cn("absolute h-3.5 w-3.5 rounded-full", STAGE_NODE_CLASS[stage.id])}
                    style={{ left: stage.node.left, top: stage.node.top }}
                    animate={
                      reduceMotion
                        ? { opacity: isActive ? 1 : 0.62, scale: isActive ? 1.2 : 1 }
                        : {
                            opacity: isActive ? [0.7, 1, 0.7] : [0.38, 0.62, 0.38],
                            scale: isActive ? [1, 1.65, 1] : [0.9, 1.12, 0.9]
                          }
                    }
                    transition={{
                      duration: reduceMotion ? 0 : 2.6,
                      delay: reduceMotion ? 0 : index * 0.16,
                      repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
                      ease: "easeInOut"
                    }}
                  />
                  <div
                    className={cn(
                      "absolute rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] backdrop-blur-xl",
                      isActive ? STAGE_BADGE_CLASS[stage.id] : "border-white/10 bg-white/5 text-slate-300"
                    )}
                    style={{
                      left: `calc(${stage.node.left} - 18px)`,
                      top: `calc(${stage.node.top} + 22px)`
                    }}
                  >
                    {stage.caption}
                  </div>
                </div>
              );
            })}

            <motion.div
              className="absolute h-4 w-4 rounded-full bg-white shadow-[0_0_28px_rgba(255,255,255,0.75)]"
              animate={
                reduceMotion
                  ? { left: activeStage.node.left, top: activeStage.node.top, scale: 1 }
                  : {
                      left: activeStage.node.left,
                      top: activeStage.node.top,
                      scale: [0.92, 1.22, 0.92]
                    }
              }
              transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <motion.div
            className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/[0.18] p-5 shadow-[0_18px_44px_rgba(2,8,23,0.24)] backdrop-blur-xl"
            key={activeStage.id}
            initial={reduceMotion ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.26em]",
                      STAGE_BADGE_CLASS[activeStage.id]
                    )}
                  >
                    {activeStage.kicker}
                  </span>
                </div>
                <h3 className="text-3xl leading-[1.02] text-white">{activeStage.title}</h3>
                <p className="text-sm leading-7 text-slate-300">{activeStage.body}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {activeStage.chips.map((chip) => (
                  <div
                    key={chip}
                    className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100"
                  >
                    {chip}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {activeStage.metrics.map((metric) => (
                  <div
                    key={metric}
                    className="rounded-[22px] border border-white/[0.08] bg-white/5 px-4 py-4"
                  >
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">System outcome</p>
                    <p className="mt-2 text-base text-white">{metric}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Move around the field to shift the light. Choose a stage to focus the system.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FLOW_STAGES.map((stage, index) => {
            const isActive = activeIndex === index;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "rounded-[24px] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
                  isActive
                    ? "border-white/[0.18] bg-white/10 shadow-[0_16px_30px_rgba(2,8,23,0.24)]"
                    : "border-white/[0.08] bg-black/[0.12] hover:border-white/[0.14] hover:bg-white/[0.06]"
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{stage.kicker}</p>
                    <p className="mt-2 text-lg text-white">{stage.label}</p>
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full", STAGE_NODE_CLASS[stage.id])} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{stage.callout}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
