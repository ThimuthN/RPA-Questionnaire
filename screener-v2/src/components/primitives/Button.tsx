"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-[transform,box-shadow,border-color,background-color,filter] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 hover:-translate-y-[2px] active:translate-y-[1px] active:scale-[0.982] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_34%,transparent_68%,rgba(255,255,255,0.08))] before:opacity-80 before:transition-opacity before:duration-200 before:content-[''] hover:before:opacity-100",
        variant === "primary" &&
          "border-brand-300/26 bg-[linear-gradient(135deg,rgba(31,111,255,1),rgba(47,134,255,0.92))] text-white shadow-[0_14px_30px_rgba(31,111,255,0.26),inset_0_1px_0_rgba(255,255,255,0.18)] hover:brightness-110 hover:shadow-[0_22px_42px_rgba(31,111,255,0.34),0_0_28px_rgba(47,134,255,0.16),inset_0_1px_0_rgba(255,255,255,0.22)]",
        variant === "secondary" &&
          "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-slate-100 shadow-[0_10px_24px_rgba(4,12,28,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-brand-300/40 hover:bg-white/[0.1] hover:shadow-[0_18px_34px_rgba(4,12,28,0.24),0_0_24px_rgba(47,134,255,0.10),inset_0_1px_0_rgba(255,255,255,0.12)]",
        variant === "danger" &&
          "border-red-400/30 bg-[linear-gradient(135deg,rgba(220,38,38,0.96),rgba(239,68,68,0.9))] text-white shadow-[0_14px_30px_rgba(127,29,29,0.25),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_18px_38px_rgba(127,29,29,0.32),inset_0_1px_0_rgba(255,255,255,0.18)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-slate-200 hover:border-white/10 hover:bg-white/[0.08] hover:text-white",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-60 transition duration-200 group-hover:opacity-100" />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{props.children}</span>
    </button>
  );
}
