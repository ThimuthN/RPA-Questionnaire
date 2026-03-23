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
        "relative overflow-hidden rounded-[24px] p-5 backdrop-blur-md",
        tone === "workspace" &&
          "border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] shadow-soft",
        tone === "summary" &&
          "border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] shadow-[var(--shadow-elevated)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(140deg,rgba(255,255,255,0.06),transparent_30%,transparent_70%,rgba(255,255,255,0.02))] before:content-['']",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
