import Image from "next/image";
import { cn } from "@/lib/utils";

function NorthstarCompactMark() {
  return (
    <div className="northstar-mark-shell relative h-[38px] w-[38px] overflow-hidden rounded-[14px] border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] shadow-[var(--app-shadow-soft)]">
      <Image
        src="/brand/northstar-icon-clean.png"
        alt="Northstar"
        fill
        sizes="38px"
        className="northstar-asset object-contain p-1.5"
        priority
      />
    </div>
  );
}

function NorthstarWordmark() {
  return (
    <div className="relative h-[32px] w-[220px] overflow-hidden max-[380px]:w-[190px]">
      <Image
        src="/brand/northstar-logo-clean.png"
        alt="Northstar"
        width={220}
        height={48}
        sizes="220px"
        className="northstar-asset block h-auto w-full max-w-none"
        priority
      />
    </div>
  );
}

export function AppLogo({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <NorthstarCompactMark />
      {!compact ? <NorthstarWordmark /> : null}
    </div>
  );
}
