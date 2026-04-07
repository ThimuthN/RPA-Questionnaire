import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/primitives/StatusPill";

type SignalTone = "emerald" | "amber" | "blue";

export function SignalCard({
  label,
  value,
  tone,
  className
}: {
  label: string;
  value: string;
  tone: SignalTone;
  className?: string;
}) {
const toneClass =
    tone === "emerald"
      ? "bg-[linear-gradient(135deg,rgba(16,185,129,0.14),var(--app-surface-muted)_72%)]"
      : tone === "amber"
      ? "bg-[linear-gradient(135deg,rgba(245,158,11,0.14),var(--app-surface-muted)_72%)]"
      : "bg-[linear-gradient(135deg,rgba(47,134,255,0.14),var(--app-surface-muted)_72%)]";
  return (
    <article
      className={cn(
        `rounded-[22px] border border-[color:var(--app-border)] ${toneClass} p-4 shadow-[var(--app-shadow-soft)] backdrop-blur-sm`,
        className
      )}
    >
      <StatusPill
        label={label}
        tone={tone === "emerald" ? "emerald" : tone === "amber" ? "amber" : "blue"}
      />
      <p className="mt-3 text-sm leading-6 text-[color:var(--app-heading)]">{value}</p>
    </article>
  );
}
