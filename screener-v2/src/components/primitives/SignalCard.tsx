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
      ? "from-emerald-500/20 to-transparent"
      : tone === "amber"
      ? "from-amber-500/20 to-transparent"
      : "from-brand-500/20 to-transparent";
  return (
    <article
      className={cn(
        `rounded-[22px] border border-white/10 bg-gradient-to-br ${toneClass} p-4 shadow-[var(--shadow-elevated)] backdrop-blur-sm`,
        className
      )}
    >
      <StatusPill
        label={label}
        tone={tone === "emerald" ? "emerald" : tone === "amber" ? "amber" : "blue"}
      />
      <p className="mt-3 text-sm leading-6 text-white">{value}</p>
    </article>
  );
}
