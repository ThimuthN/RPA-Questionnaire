import Image from "next/image";
import { cn } from "@/lib/utils";

function StarryCompactMark() {
  return (
    <div className="northstar-mark-shell relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] shadow-[var(--app-shadow-soft)]">
      <Image
        src="/brand/northstar-icon-clean.png"
        alt="Starry"
        fill
        sizes="40px"
        className="northstar-asset northstar-icon-asset object-contain p-1.5"
        priority
      />
    </div>
  );
}

function StarryWordmark() {
  return (
    <div className="flex flex-col items-start justify-center gap-0">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="northstar-asset northstar-icon-asset select-none text-[17px] leading-none"
          style={{ fontFamily: "serif" }}
        >
          ✦
        </span>
        <span
          className="northstar-asset northstar-logo-asset select-none font-display text-[19px] font-semibold leading-none tracking-[-0.02em]"
        >
          Starry
        </span>
      </div>
      <p className="northstar-tagline ml-[25px] text-[9px] uppercase tracking-[0.24em] leading-none mt-[3px]">
        Talent OS
      </p>
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
    <div
      className={cn(
        "flex shrink-0 items-center",
        className
      )}
    >
      {compact ? <StarryCompactMark /> : (
        <div className="flex items-center gap-3">
          <StarryCompactMark />
          <StarryWordmark />
        </div>
      )}
    </div>
  );
}
