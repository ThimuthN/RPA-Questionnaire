import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function ActionRail({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 flex flex-wrap items-center gap-2 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-surface)] p-3 shadow-[0_-10px_30px_color-mix(in_srgb,var(--app-heading)_10%,transparent)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
