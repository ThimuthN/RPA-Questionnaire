import { cn } from "@/lib/utils";

type Tone = "neutral" | "blue" | "teal" | "emerald" | "amber" | "red" | "purple";

const toneClass: Record<Tone, string> = {
  neutral: "border-[color:var(--pill-neutral-border)] bg-[color:var(--pill-neutral-bg)] text-[color:var(--pill-neutral-text)]",
  blue: "border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] text-[color:var(--pill-blue-text)]",
  teal: "border-[color:var(--pill-teal-border)] bg-[color:var(--pill-teal-bg)] text-[color:var(--pill-teal-text)]",
  emerald: "border-[color:var(--pill-emerald-border)] bg-[color:var(--pill-emerald-bg)] text-[color:var(--pill-emerald-text)]",
  amber: "border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] text-[color:var(--pill-amber-text)]",
  red: "border-[color:var(--pill-red-border)] bg-[color:var(--pill-red-bg)] text-[color:var(--pill-red-text)]",
  purple: "border-[color:var(--pill-purple-border)] bg-[color:var(--pill-purple-bg)] text-[color:var(--pill-purple-text)]"
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,background-color,box-shadow,transform,filter,color] duration-[var(--scene-interaction)] hover:-translate-y-[1px] hover:brightness-105",
        toneClass[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
