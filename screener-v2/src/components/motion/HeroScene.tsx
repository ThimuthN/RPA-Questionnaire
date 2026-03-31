"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HeroScene({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 54, y: 42 });

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_20%_18%,rgba(138,184,255,0.24),transparent_26%),radial-gradient(circle_at_78%_20%,rgba(18,179,168,0.12),transparent_22%),linear-gradient(180deg,rgba(11,24,46,0.98),rgba(5,11,22,1))] p-6 shadow-[0_28px_120px_rgba(2,8,23,0.45)]",
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
        className="absolute bottom-[12%] right-[10%] h-52 w-52 rounded-full border border-teal-300/10 bg-teal-400/10 blur-2xl"
        animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: reduceMotion ? 0 : 7.2, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-[520px] flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-full border border-brand-300/20 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-brand-200">
            Motion system
          </div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Clear. Fast. Alive.</div>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-8">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 700" fill="none" aria-hidden="true">
            <motion.path
              d="M180 530 C 330 380, 470 300, 640 312 S 820 392, 860 470"
              stroke="rgba(138,184,255,0.26)"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{ duration: reduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.path
              d="M220 220 C 350 210, 430 260, 510 330 S 690 480, 806 450"
              stroke="rgba(18,179,168,0.22)"
              strokeWidth="1.3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.12 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: reduceMotion ? 0 : 1.35, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          {[
            { left: "23%", top: "64%", delay: 0 },
            { left: "48%", top: "34%", delay: 0.18 },
            { left: "78%", top: "52%", delay: 0.34 }
          ].map((node) => (
            <motion.div
              key={`${node.left}-${node.top}`}
              className="absolute h-3 w-3 rounded-full bg-brand-200 shadow-[0_0_18px_rgba(138,184,255,0.55)]"
              style={{ left: node.left, top: node.top }}
              animate={reduceMotion ? { opacity: 0.8 } : { opacity: [0.45, 1, 0.45], scale: [0.9, 1.5, 0.9] }}
              transition={{ duration: reduceMotion ? 0 : 2.8, delay: node.delay, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          ))}

          <motion.div
            className="absolute h-4 w-4 rounded-full bg-white shadow-[0_0_28px_rgba(255,255,255,0.75)]"
            animate={
              reduceMotion
                ? { left: "48%", top: "38%" }
                : {
                    left: ["22%", "47%", "77%", "52%", "22%"],
                    top: ["64%", "34%", "52%", "58%", "64%"],
                    scale: [0.9, 1.2, 1, 1.15, 0.9]
                  }
            }
            transition={{ duration: reduceMotion ? 0 : 8, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />

          <motion.div
            className="relative h-[320px] w-[320px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(138,184,255,0.10),rgba(138,184,255,0.03)_44%,transparent_72%)]"
            animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.03, 1], opacity: [0.8, 1, 0.84] }}
            transition={{ duration: reduceMotion ? 0 : 5.2, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <div className="absolute inset-[14%] rounded-full border border-brand-300/16" />
            <div className="absolute inset-[28%] rounded-full border border-teal-300/12" />
            <div className="absolute inset-[42%] rounded-full border border-white/10" />
          </motion.div>
        </div>

        <div className="flex justify-center">
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200 shadow-[0_12px_26px_rgba(2,8,23,0.24)] backdrop-blur-xl">
            Watch it move
          </div>
        </div>
      </div>
    </div>
  );
}
