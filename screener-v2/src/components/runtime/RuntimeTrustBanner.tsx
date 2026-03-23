import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";

type BannerTone = "neutral" | "blue" | "teal" | "emerald" | "amber" | "red";

function timeLabel(value?: string) {
  if (!value) return "Checking sync";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Checking sync";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function RuntimeTrustBanner({
  statusLabel,
  statusTone,
  lastSyncedAt,
  integrityPresetLabel,
  note
}: {
  statusLabel: string;
  statusTone: BannerTone;
  lastSyncedAt?: string;
  integrityPresetLabel: string;
  note?: string;
}) {
  return (
    <StagePanel tone="summary" className="px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={statusLabel} tone={statusTone} />
          <StatusPill label={`Preset ${integrityPresetLabel}`} tone="neutral" />
          <StatusPill label={`Last sync ${timeLabel(lastSyncedAt)}`} tone="neutral" className="normal-case tracking-normal" />
        </div>
        <p className="max-w-2xl text-sm text-slate-200">
          {note || "Your answers keep saving while you work. If something interrupts the flow, you will be guided back in."}
        </p>
      </div>
    </StagePanel>
  );
}
