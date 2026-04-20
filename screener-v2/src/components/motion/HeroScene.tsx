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
    label: "Track",
    kicker: "Bring the right context together",
    title: "Keep people, roles, and progress connected.",
    body: "Context stays in one place, so the next step starts with the right information.",
    callout: "Start from context, not cleanup.",
    chips: ["People and roles linked", "History stays visible"],
    metrics: ["Less handoff noise", "Shared context"],
    node: { left: "23%", top: "64%" },
    caption: "Context"
  },
  {
    id: "run",
    label: "Evaluate",
    kicker: "Run the review clearly",
    title: "Run reviews in one guided flow.",
    body: "Assessments, audits, and check-ins can live in the same process without splitting the work.",
    callout: "The process stays focused and easy to run.",
    chips: ["Flexible evaluation steps", "Goals and reviews aligned"],
    metrics: ["Cleaner handoffs", "Consistent review"],
    node: { left: "48%", top: "34%" },
    caption: "Review"
  },
  {
    id: "review",
    label: "Decide",
    kicker: "Move with confidence",
    title: "Turn signals and notes into the next decision.",
    body: "Results and reviewer input stay close, so decisions are easier to make and easier to explain.",
    callout: "Go from review to action faster.",
    chips: ["Evidence stays connected", "Next steps stay clear"],
    metrics: ["Faster decisions", "Clear direction"],
    node: { left: "78%", top: "52%" },
    caption: "Decision"
  }
];

const STAGE_BADGE_CLASS: Record<FlowStage["id"], string> = {
  build: "border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] text-[color:var(--pill-blue-text)]",
  run: "border-[color:var(--pill-teal-border)] bg-[color:var(--pill-teal-bg)] text-[color:var(--pill-teal-text)]",
  review: "border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] text-[color:var(--pill-amber-text)]"
};

const STAGE_NODE_CLASS: Record<FlowStage["id"], string> = {
  build: "bg-brand-200 shadow-[0_0_24px_rgba(138,184,255,0.7)]",
  run: "bg-teal-200 shadow-[0_0_24px_rgba(94,234,212,0.65)]",
  review: "bg-amber-200 shadow-[0_0_24px_rgba(252,211,77,0.65)]"
};

const STAGE_PANEL_CLASS: Record<FlowStage["id"], string> = {
  build: "border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] text-[color:var(--pill-blue-text)]",
  run: "border-[color:var(--pill-teal-border)] bg-[color:var(--pill-teal-bg)] text-[color:var(--pill-teal-text)]",
  review: "border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] text-[color:var(--pill-amber-text)]"
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
        "relative isolate overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_18%_18%,rgba(138,184,255,0.18),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(18,179,168,0.16),transparent_24%),linear-gradient(180deg,rgba(10,18,31,0.72),rgba(7,15,27,0.9))] p-6 shadow-[0_24px_60px_rgba(5,11,22,0.26)]",
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />

      <motion.div
        className="pointer-events-none absolute inset-0 opacity-80"
        animate={
          reduceMotion
            ? { background: "radial-gradient(circle at 54% 42%, color-mix(in_srgb,var(--blue-300)_22%,transparent), transparent 28%)" }
            : { background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, color-mix(in_srgb,var(--blue-300)_26%,transparent), transparent 28%)` }
        }
        transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="absolute left-[8%] top-[14%] h-48 w-48 rounded-full border border-[color:rgba(138,184,255,0.16)] bg-[color:rgba(47,134,255,0.12)] blur-2xl"
        animate={reduceMotion ? { opacity: 0.6 } : { opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}
        transition={{ duration: reduceMotion ? 0 : 6.5, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[8%] h-52 w-52 rounded-full border border-[color:rgba(18,179,168,0.14)] bg-[color:rgba(18,179,168,0.11)] blur-2xl"
        animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: reduceMotion ? 0 : 7.2, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-[440px] flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-full border border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-[color:var(--pill-blue-text)]">
            Northstar flow
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.22em] text-[color:var(--app-scene-muted)]">Track. Review. Decide.</div>
        </div>

        <div className="grid flex-1 gap-5 xl:grid-cols-[1.18fr_0.82fr] xl:items-center">
          <div className="relative flex min-h-[280px] items-center justify-center">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 700" fill="none" aria-hidden="true">
              <motion.path
                d="M180 530 C 330 380, 470 300, 640 312 S 820 392, 860 470"
                stroke="color-mix(in_srgb,var(--blue-300)_34%,transparent)"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.2 }}
                animate={{ pathLength: 1, opacity: activeStage.id === "build" ? 0.95 : 0.55 }}
                transition={{ duration: reduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.path
                d="M220 220 C 350 210, 430 260, 510 330 S 690 480, 806 450"
                stroke="color-mix(in_srgb,var(--teal-500)_28%,transparent)"
                strokeWidth="1.3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.12 }}
                animate={{ pathLength: 1, opacity: activeStage.id === "run" ? 0.92 : 0.5 }}
                transition={{ duration: reduceMotion ? 0 : 1.35, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.path
                d="M514 146 C 610 170, 680 242, 708 336 S 710 518, 624 588"
                stroke="color-mix(in_srgb,var(--amber-500)_22%,transparent)"
                strokeWidth="1.3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.1 }}
                animate={{ pathLength: 1, opacity: activeStage.id === "review" ? 0.88 : 0.42 }}
                transition={{ duration: reduceMotion ? 0 : 1.25, delay: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>

            <motion.div
              className="relative h-[270px] w-[270px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(138,184,255,0.18),rgba(138,184,255,0.06)_44%,transparent_72%)] sm:h-[300px] sm:w-[300px]"
              animate={
                reduceMotion
                  ? { scale: 1, rotate: 0 }
                  : { scale: [1, 1.03, 1], opacity: [0.8, 1, 0.84], rotate: [0, 6, 0] }
              }
              transition={{ duration: reduceMotion ? 0 : 5.2, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <div className="absolute inset-[14%] rounded-full border border-[color:color-mix(in_srgb,var(--blue-300)_24%,transparent)]" />
              <div className="absolute inset-[28%] rounded-full border border-[color:color-mix(in_srgb,var(--teal-500)_18%,transparent)]" />
              <div className="absolute inset-[42%] rounded-full border border-white/10" />

              <div className="absolute inset-[30%] grid place-items-center">
                <motion.div
                  className={cn(
                    "rounded-[24px] border px-4 py-3 text-center shadow-[0_18px_40px_rgba(4,12,28,0.22)] backdrop-blur-xl",
                    STAGE_PANEL_CLASS[activeStage.id]
                  )}
                  key={activeStage.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--app-scene-muted)]">{activeStage.kicker}</p>
                  <p className="mt-2 font-display text-xl text-[color:var(--app-scene-heading)]">{activeStage.label}</p>
                  <p className="mt-1 max-w-[9rem] text-[11px] leading-5 text-[color:var(--app-scene-text)]">{activeStage.callout}</p>
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
                      isActive
                        ? STAGE_BADGE_CLASS[stage.id]
                        : "border-white/10 bg-[rgba(255,255,255,0.05)] text-[color:var(--app-scene-muted)]"
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
              className="absolute h-4 w-4 rounded-full bg-white shadow-[0_0_28px_rgba(138,184,255,0.46)]"
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
            className="relative max-w-[380px] overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(9,17,31,0.66)] p-5 shadow-[0_18px_40px_rgba(4,12,28,0.22)] backdrop-blur-xl xl:justify-self-end"
            key={activeStage.id}
            initial={reduceMotion ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
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
                <h3 className="text-2xl leading-[1.06] text-[color:var(--app-scene-heading)]">{activeStage.title}</h3>
                <p className="text-sm leading-6 text-[color:var(--app-scene-text)]">{activeStage.body}</p>
              </div>

              <div className="space-y-2">
                {activeStage.chips.map((chip) => (
                  <div
                    key={chip}
                    className="rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-[color:var(--app-scene-heading)]"
                  >
                    {chip}
                  </div>
                ))}
              </div>

              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--app-scene-muted)]">{activeStage.metrics.join(" · ")}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
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
                    ? "border-white/16 bg-[rgba(12,22,37,0.72)] shadow-[0_18px_40px_rgba(4,12,28,0.22)]"
                    : "border-white/10 bg-[rgba(255,255,255,0.04)] hover:border-white/16 hover:bg-[rgba(255,255,255,0.08)]"
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--app-scene-muted)]">{stage.kicker}</p>
                    <p className="mt-2 text-lg text-[color:var(--app-scene-heading)]">{stage.label}</p>
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full", STAGE_NODE_CLASS[stage.id])} />
                </div>
                <p className="mt-2 text-sm leading-5 text-[color:var(--app-scene-text)]">{stage.callout}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
