import type { ReactNode } from "react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StagePanel } from "@/components/scene/StagePanel";

type HudTone = "blue" | "teal" | "emerald" | "amber" | "red";

function fmt(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function HudBar({
  stageLabel,
  roleId,
  sectionProgressValue,
  remainingSeconds,
  statusLabel,
  statusTone,
  trustStrip
}: {
  stageLabel: string;
  roleId?: string;
  sectionProgressValue: string;
  remainingSeconds: number;
  statusLabel: string;
  statusTone: HudTone;
  trustStrip?: ReactNode;
}) {
  const timerClass =
    remainingSeconds <= 120 ? "text-red-200 runtime-timer-critical" : remainingSeconds <= 300 ? "text-amber-200" : "text-white";

  return (
    <StagePanel className="px-4 py-4 md:px-5">
      <div className="space-y-3">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)_auto] lg:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label={stageLabel} tone={stageLabel.toLowerCase().includes("core") ? "blue" : "teal"} />
              <StatusPill label={roleId || "Generic"} tone="neutral" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
              <span>Progress</span>
              <span>{sectionProgressValue}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(47,134,255,1),rgba(18,179,168,0.92))] transition-all duration-300"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      Number(sectionProgressValue.split("/")[1]) > 0
                        ? (Number(sectionProgressValue.split("/")[0]) / Number(sectionProgressValue.split("/")[1])) * 100
                        : 0
                    )
                  )}%`
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <StatusPill label={statusLabel} tone={statusTone} />
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Time Left</p>
              <p className={`font-mono text-2xl ${timerClass}`}>{fmt(remainingSeconds)}</p>
            </div>
          </div>
        </div>

        {trustStrip ? <div>{trustStrip}</div> : null}
      </div>
    </StagePanel>
  );
}
