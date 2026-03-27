import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type StagePanelTone = "workspace" | "summary";

export function StagePanel({
  children,
  className,
  tone = "workspace",
  ...props
}: PropsWithChildren<ComponentPropsWithoutRef<"section"> & { tone?: StagePanelTone }>) {
  return (
    <section
      {...props}
      className={cn(
        "relative overflow-hidden rounded-[28px] p-6 backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform,filter] duration-[var(--scene-interaction)] ease-out hover:-translate-y-[2px] hover:border-white/14 hover:shadow-[0_28px_68px_rgba(4,12,28,0.30)]",
        tone === "workspace" &&
          "border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] shadow-[var(--glow-panel-soft)]",
        tone === "summary" &&
          "border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.07))] shadow-[var(--shadow-elevated)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(140deg,rgba(255,255,255,0.08),transparent_26%,transparent_70%,rgba(111,215,255,0.04))] before:opacity-85 before:transition-opacity before:duration-[var(--scene-interaction)] before:content-[''] hover:before:opacity-100 after:pointer-events-none after:absolute after:inset-x-8 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] after:opacity-80 after:content-['']",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
