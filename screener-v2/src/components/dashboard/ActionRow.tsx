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
        tone === "attention" && "border-amber-300/20 bg-[linear-gradient(180deg,rgba(230,160,25,0.12),rgba(255,255,255,0.05))]",
        tone === "positive" && "border-emerald-300/20 bg-[linear-gradient(180deg,rgba(32,178,107,0.12),rgba(255,255,255,0.05))]",
        className
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
          <div className="space-y-1">
            <p className="text-lg text-white">{title}</p>
            {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
            {description ? <p className="text-sm leading-6 text-brand-100">{description}</p> : null}
          </div>
          {meta ? <div className="text-xs text-slate-400">{meta}</div> : null}
        </div>

        <div className="flex w-full flex-col gap-4 xl:w-[360px] xl:items-end">
          {metrics?.length ? (
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[18px] border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                  <p className="mt-1 text-base text-white">{metric.value}</p>
                  {metric.hint ? <p className="mt-1 text-xs text-slate-400">{metric.hint}</p> : null}
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
