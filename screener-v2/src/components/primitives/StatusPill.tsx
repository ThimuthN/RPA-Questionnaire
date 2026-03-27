import { cn } from "@/lib/utils";

type Tone = "neutral" | "blue" | "teal" | "emerald" | "amber" | "red" | "purple";

const toneClass: Record<Tone, string> = {
  neutral: "border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-slate-200",
  blue: "border-brand-300/35 bg-[linear-gradient(180deg,rgba(47,134,255,0.20),rgba(47,134,255,0.08))] text-brand-100",
  teal: "border-teal-400/35 bg-[linear-gradient(180deg,rgba(18,179,168,0.20),rgba(18,179,168,0.08))] text-teal-100",
  emerald: "border-emerald-400/35 bg-[linear-gradient(180deg,rgba(32,178,107,0.20),rgba(32,178,107,0.08))] text-emerald-100",
  amber: "border-amber-400/35 bg-[linear-gradient(180deg,rgba(230,160,25,0.22),rgba(230,160,25,0.08))] text-amber-100",
  red: "border-red-400/35 bg-[linear-gradient(180deg,rgba(214,69,93,0.22),rgba(214,69,93,0.08))] text-red-100",
  purple: "border-purple-400/35 bg-[linear-gradient(180deg,rgba(157,140,255,0.20),rgba(157,140,255,0.08))] text-purple-100"
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[border-color,background-color,box-shadow,transform,filter] duration-[var(--scene-interaction)] hover:-translate-y-[1px] hover:brightness-105",
        toneClass[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
