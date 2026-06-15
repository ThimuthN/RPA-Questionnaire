import Image from "next/image";
import { cn } from "@/lib/utils";

function NorthstarCompactMark({ pubStyle = false }: { pubStyle?: boolean }) {
  return (
    <div className={cn(
      "northstar-mark-shell relative h-10 w-10 overflow-hidden rounded-[14px] border shadow-[var(--app-shadow-soft)]",
      pubStyle
        ? "pub-logo-mark border-[color:var(--pub-border)] bg-[color:var(--pub-active-bg)]"
        : "border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)]"
    )}>
      <Image
        src="/brand/northstar-icon-clean.png"
        alt="Northstar"
        fill
        sizes="40px"
        className="northstar-asset northstar-icon-asset object-contain p-1.5"
        priority
      />
    </div>
  );
}

function NorthstarWordmark({ pubStyle = false }: { pubStyle?: boolean }) {
  return (
    <div className={cn(
      "hidden min-[1080px]:flex min-[1080px]:min-w-[248px] flex-col items-center justify-center gap-0.5",
      pubStyle && "pub-logo-mark"
    )}>
      <div className="relative h-[34px] w-[248px] overflow-hidden">
        <Image
          src="/brand/northstar-logo-clean.png"
          alt="Northstar"
          width={248}
          height={50}
          sizes="248px"
          className="northstar-asset northstar-logo-asset block h-full w-full object-contain object-center"
          priority
        />
      </div>
      <p className="northstar-tagline text-[10px] uppercase tracking-[0.22em]">
        Tracking trajectory
      </p>
    </div>
  );
}

export function AppLogo({
  className,
  compact = false,
  pubStyle = false
}: {
  className?: string;
  compact?: boolean;
  pubStyle?: boolean;
}) {
  return (
    <div
      className={cn(
        compact ? "flex shrink-0 items-center" : "flex shrink-0 items-center min-[1080px]:min-w-[248px]",
        className
      )}
    >
      {compact ? (
        <NorthstarCompactMark pubStyle={pubStyle} />
      ) : (
        <NorthstarWordmark pubStyle={pubStyle} />
      )}
    </div>
  );
}
