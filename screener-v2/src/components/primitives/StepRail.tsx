import { StatusPill } from "@/components/primitives/StatusPill";
import { cn } from "@/lib/utils";

export interface StepRailItem {
  id: string;
  label: string;
}

export function StepRail({
  steps,
  activeId,
  className
}: {
  steps: StepRailItem[];
  activeId: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2 md:grid-cols-3", className)}>
      {steps.map((step, index) => {
        const active = step.id === activeId;
        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 rounded-full border px-3 py-2.5 text-sm transition",
              active
                ? "border-brand-400/60 bg-brand-500/20 text-white shadow-[0_12px_30px_rgba(31,111,255,0.18)]"
                : "border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] text-[color:var(--app-muted)]"
            )}
          >
            <StatusPill label={`${index + 1}`} tone={active ? "blue" : "neutral"} />
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
