"use client";

import Rive, { Alignment, Fit, Layout } from "@rive-app/react-canvas";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-36 w-36",
  hero: "h-[240px] w-[240px] sm:h-[320px] sm:w-[320px]"
} as const;

const mascotLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center
});

export function RiveMascot({
  className,
  size = "lg",
  glow = true
}: {
  className?: string;
  size?: keyof typeof sizeClasses;
  glow?: boolean;
}) {
  return (
    <div className={cn("relative isolate", sizeClasses[size], className)}>
      {glow ? <div className="absolute inset-0 rounded-full bg-brand-400/18 blur-2xl" /> : null}
      <div className="absolute inset-0 rounded-full border border-white/8 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_56%,transparent_72%)]" />
      <Rive
        src="/mascot/robot-expressions.riv"
        artboard="Artboard"
        stateMachines="State Machine 1"
        layout={mascotLayout}
        className="relative h-full w-full"
      />
    </div>
  );
}
