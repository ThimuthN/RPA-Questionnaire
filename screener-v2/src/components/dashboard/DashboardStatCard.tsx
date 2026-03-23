import type { ReactNode } from "react";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";

type StatTone = "neutral" | "blue" | "teal" | "emerald" | "amber" | "red";

export function DashboardStatCard({
  label,
  value,
  detail,
  tone = "neutral",
  badge
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: StatTone;
  badge?: string;
}) {
  return (
    <StagePanel tone="summary" className="h-full p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
          {badge ? <StatusPill label={badge} tone={tone} /> : null}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-white">{value}</p>
          {detail ? <p className="text-sm leading-6 text-slate-300">{detail}</p> : null}
        </div>
      </div>
    </StagePanel>
  );
}
