import { cn } from "@/lib/utils";

type Tone = "neutral" | "blue" | "teal" | "emerald" | "amber" | "red" | "purple";

const toneClass: Record<Tone, string> = {
  neutral: "border-white/16 bg-white/[0.06] text-slate-200",
  blue: "border-brand-300/45 bg-brand-500/15 text-brand-100",
  teal: "border-teal-400/45 bg-teal-500/15 text-teal-100",
  emerald: "border-emerald-400/45 bg-emerald-500/15 text-emerald-100",
  amber: "border-amber-400/45 bg-amber-500/15 text-amber-100",
  red: "border-red-400/45 bg-red-500/15 text-red-100",
  purple: "border-purple-400/45 bg-purple-500/15 text-purple-100"
};

export function StatusPill({
  label,
  tone = "neutral",
  className
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[border-color,background-color,box-shadow,transform] duration-[var(--scene-interaction)]",
        toneClass[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
