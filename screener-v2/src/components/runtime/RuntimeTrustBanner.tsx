import { StagePanel } from "@/components/scene/StagePanel";

function timeLabel(value?: string) {
  if (!value) return "Checking sync";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Checking sync";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function RuntimeTrustBanner({
  lastSyncedAt,
  integrityPresetLabel,
  note
}: {
  lastSyncedAt?: string;
  integrityPresetLabel: string;
  note?: string;
}) {
  return (
    <StagePanel tone="summary" className="px-4 py-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-2xl text-sm text-slate-200">
          {note || "Your answers keep saving while you work. If something interrupts the flow, you will be guided back in."}
        </p>
        <p className="text-xs text-slate-400">
          {integrityPresetLabel} preset | Last sync {timeLabel(lastSyncedAt)}
        </p>
      </div>
    </StagePanel>
  );
}
