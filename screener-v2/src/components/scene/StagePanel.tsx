import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type StagePanelTone = "workspace" | "summary" | "open";

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
        "group relative overflow-hidden rounded-[28px] p-6 backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform,filter] duration-[var(--scene-interaction)] ease-out",
        tone === "workspace" &&
          "border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] shadow-[var(--app-shadow)] hover:-translate-y-[2px]",
        tone === "summary" &&
          "border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-muted))] shadow-[var(--app-shadow-soft)] hover:-translate-y-[2px]",
        tone === "open" &&
          "border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] shadow-none",
        tone !== "open" &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(140deg,rgba(255,255,255,0.08),transparent_26%,transparent_70%,rgba(111,215,255,0.04))] before:opacity-60 before:transition-opacity before:duration-[var(--scene-interaction)] before:content-[''] hover:before:opacity-100 after:pointer-events-none after:absolute after:inset-x-8 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] after:opacity-70 after:content-['']",
        className
      )}
    >
      {tone !== "open" ? (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-[var(--scene-interaction)] group-hover:opacity-100">
          <div className="absolute inset-x-[18%] top-[-16%] h-24 rounded-full bg-brand-300/10 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[10%] h-28 w-40 rounded-full bg-cyan-300/8 blur-3xl" />
        </div>
      ) : null}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
