import { cn } from "@/lib/utils";
import { RiveMascot } from "@/components/brand/RiveMascot";

export function AppLogo({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-md" />
        <RiveMascot size={compact ? "sm" : "md"} glow={!compact} className="relative" />
      </div>
      {!compact ? (
        <div className="space-y-0.5">
          <p className="font-display text-lg tracking-[0.02em] text-white">Assessment Hub</p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Screening workspace</p>
        </div>
      ) : null}
    </div>
  );
}
