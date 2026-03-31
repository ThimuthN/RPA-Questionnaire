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
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-[transform,box-shadow,border-color,background-color,filter,color] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 hover:-translate-y-[2px] active:translate-y-[1px] active:scale-[0.982] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_34%,transparent_68%,rgba(255,255,255,0.08))] before:opacity-80 before:transition-opacity before:duration-200 before:content-[''] hover:before:opacity-100",
        variant === "primary" &&
          "border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_14px_30px_color-mix(in_srgb,var(--app-brand)_28%,transparent)] hover:brightness-105 hover:shadow-[0_18px_34px_color-mix(in_srgb,var(--app-brand)_34%,transparent)]",
        variant === "secondary" &&
          "border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]",
        variant === "danger" &&
          "border-transparent bg-[linear-gradient(135deg,var(--app-danger),color-mix(in_srgb,var(--app-danger)_84%,#ffffff))] text-white shadow-[0_12px_26px_color-mix(in_srgb,var(--app-danger)_22%,transparent)] hover:shadow-[0_16px_34px_color-mix(in_srgb,var(--app-danger)_28%,transparent)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[color:var(--app-muted)] hover:border-[color:var(--app-border)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-60 transition duration-200 group-hover:opacity-100" />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{props.children}</span>
    </button>
  );
}
