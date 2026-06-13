import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type StagePanelTone = "workspace" | "summary" | "open" | "flat";

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
        "group relative overflow-hidden rounded-xl p-5 transition-[border-color,background-color,box-shadow,transform] duration-[var(--scene-interaction)] ease-out",
        tone === "workspace" &&
          "border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] shadow-[var(--app-shadow)] backdrop-blur-xl hover:-translate-y-[2px]",
        tone === "summary" &&
          "border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-muted))] shadow-[var(--app-shadow-soft)] backdrop-blur-xl hover:-translate-y-[2px]",
        tone === "open" &&
          "border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] shadow-none",
        tone === "flat" &&
          "border border-[color:var(--app-border)]/50 bg-[color:var(--app-surface)]",
        className
      )}
    >
      {tone === "workspace" || tone === "summary" ? (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-[var(--scene-interaction)] group-hover:opacity-100">
          <div className="absolute inset-x-[18%] top-[-16%] h-24 rounded-full bg-brand-300/10 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[10%] h-28 w-40 rounded-full bg-cyan-300/8 blur-3xl" />
        </div>
      ) : null}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
