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
      <div className="relative overflow-hidden rounded-[18px] border border-[color:var(--app-header-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-header-surface)_90%,white),color-mix(in_srgb,var(--app-header-surface)_82%,transparent))] p-1.5 shadow-[var(--app-shadow-soft)]">
        <Image src="/icon.svg" alt="" width={compact ? 32 : 44} height={compact ? 32 : 44} className="block" />
      </div>
      {!compact ? (
        <div className="space-y-0.5">
          <p className="font-display text-lg tracking-[0.02em] text-[color:var(--app-scene-heading)]">Assessment Hub</p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--app-scene-text)]">Screening workspace</p>
        </div>
      ) : null}
    </div>
  );
}
