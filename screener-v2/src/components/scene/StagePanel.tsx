import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function StagePanel({
  children,
  className,
  ...props
}: PropsWithChildren<ComponentPropsWithoutRef<"section">>) {
  return (
    <section
      {...props}
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] p-5 shadow-soft backdrop-blur-md",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(140deg,rgba(255,255,255,0.06),transparent_30%,transparent_70%,rgba(255,255,255,0.02))] before:content-['']",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
