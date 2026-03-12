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
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 active:scale-[0.98]",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,rgba(31,111,255,1),rgba(47,134,255,0.88))] text-white shadow-[0_10px_24px_rgba(31,111,255,0.25)] hover:brightness-110",
        variant === "secondary" &&
          "border border-white/20 bg-white/5 text-slate-100 hover:border-brand-300/60 hover:bg-white/[0.08]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
        variant === "ghost" && "text-slate-200 hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}
