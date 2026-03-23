import type { PropsWithChildren, ReactNode } from "react";
import { StagePanel } from "@/components/scene/StagePanel";
import { cn } from "@/lib/utils";

export function DashboardFilterBar({
  children,
  actions,
  className
}: PropsWithChildren<{
  actions?: ReactNode;
  className?: string;
}>) {
  return (
    <StagePanel tone="summary" className={cn("p-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">{children}</div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </StagePanel>
  );
}
