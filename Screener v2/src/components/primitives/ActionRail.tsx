import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function ActionRail({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 flex flex-wrap items-center gap-2 rounded-[24px] border border-white/10 bg-ink-950/90 p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
