import type { ReactNode } from "react";
import { StagePanel } from "@/components/scene/StagePanel";
import { cn } from "@/lib/utils";

type ActionRowTone = "standard" | "attention" | "positive";

export function ActionRow({
  badges,
  title,
  subtitle,
  description,
  meta,
  metrics,
  actions,
  tone = "standard",
  className
}: {
  badges?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  metrics?: Array<{ label: string; value: ReactNode; hint?: ReactNode }>;
  actions?: ReactNode;
  tone?: ActionRowTone;
  className?: string;
}) {
  return (
    <StagePanel
      className={cn(
        "p-4",
        tone === "attention" &&
          "border-[color:var(--app-warning)]/20 bg-[linear-gradient(180deg,var(--app-warning-soft),var(--app-surface-soft))]",
        tone === "positive" &&
          "border-[color:var(--app-success)]/20 bg-[linear-gradient(180deg,var(--app-success-soft),var(--app-surface-soft))]",
        className
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
          <div className="space-y-1">
            <p className="text-lg text-[color:var(--app-heading)]">{title}</p>
            {subtitle ? <p className="text-sm text-[color:var(--app-text)]">{subtitle}</p> : null}
            {description ? <p className="text-sm leading-6 text-[color:var(--app-muted)]">{description}</p> : null}
          </div>
          {meta ? <div className="text-xs text-[color:var(--app-muted)]">{meta}</div> : null}
        </div>

        <div className="flex w-full flex-col gap-4 xl:w-[360px] xl:items-end">
          {metrics?.length ? (
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{metric.label}</p>
                  <p className="mt-1 text-base text-[color:var(--app-heading)]">{metric.value}</p>
                  {metric.hint ? <p className="mt-1 text-xs text-[color:var(--app-muted)]">{metric.hint}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
          {actions ? <div className="flex w-full flex-wrap gap-2 xl:justify-end">{actions}</div> : null}
        </div>
      </div>
    </StagePanel>
  );
}
