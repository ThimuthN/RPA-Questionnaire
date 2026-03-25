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
        "relative inline-flex items-center justify-center overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-[transform,box-shadow,border-color,background-color,filter] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.985]",
        variant === "primary" &&
          "border-brand-300/30 bg-[linear-gradient(135deg,rgba(31,111,255,1),rgba(47,134,255,0.92))] text-white shadow-[0_14px_30px_rgba(31,111,255,0.26),inset_0_1px_0_rgba(255,255,255,0.18)] hover:brightness-110 hover:shadow-[0_18px_38px_rgba(31,111,255,0.34),inset_0_1px_0_rgba(255,255,255,0.22)]",
        variant === "secondary" &&
          "border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-slate-100 shadow-[0_10px_24px_rgba(4,12,28,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-brand-300/45 hover:bg-white/[0.1] hover:shadow-[0_16px_32px_rgba(4,12,28,0.24),inset_0_1px_0_rgba(255,255,255,0.12)]",
        variant === "danger" &&
          "border-red-400/30 bg-[linear-gradient(135deg,rgba(220,38,38,0.96),rgba(239,68,68,0.9))] text-white shadow-[0_14px_30px_rgba(127,29,29,0.25),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_18px_38px_rgba(127,29,29,0.32),inset_0_1px_0_rgba(255,255,255,0.18)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-slate-200 hover:border-white/10 hover:bg-white/[0.08] hover:text-white",
        className
      )}
      {...props}
    />
  );
}
