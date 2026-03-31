import Image from "next/image";
import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-1.5 shadow-[0_10px_22px_rgba(4,12,28,0.18)]">
        <Image src="/icon.svg" alt="" width={compact ? 32 : 44} height={compact ? 32 : 44} className="block" />
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
