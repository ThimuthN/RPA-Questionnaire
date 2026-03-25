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
        "relative overflow-hidden rounded-[24px] p-5 backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-[var(--scene-interaction)] ease-out hover:border-white/18 hover:shadow-[0_22px_60px_rgba(4,12,28,0.28)]",
        tone === "workspace" &&
          "border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] shadow-soft",
        tone === "summary" &&
          "border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] shadow-[var(--shadow-elevated)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(140deg,rgba(255,255,255,0.07),transparent_30%,transparent_70%,rgba(255,255,255,0.03))] before:opacity-80 before:transition-opacity before:duration-[var(--scene-interaction)] before:content-[''] hover:before:opacity-100 after:pointer-events-none after:absolute after:inset-x-6 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] after:opacity-75 after:content-['']",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
