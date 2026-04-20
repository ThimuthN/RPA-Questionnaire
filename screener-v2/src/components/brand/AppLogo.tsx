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
    <div className="relative hidden h-[42px] w-[250px] overflow-hidden lg:block xl:w-[250px] max-[1220px]:w-[205px]">
      <Image
        src="/brand/northstar-logo-clean.png"
        alt="Northstar"
        width={250}
        height={53}
        sizes="250px"
        className="northstar-asset block h-full w-full object-contain object-left"
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
    <div className={cn("flex shrink-0 items-center gap-3 min-[1221px]:min-w-[295px]", className)}>
      <NorthstarCompactMark />
      {!compact ? <NorthstarWordmark /> : null}
    </div>
  );
}
