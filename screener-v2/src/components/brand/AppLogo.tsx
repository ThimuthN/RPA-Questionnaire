import { useId } from "react";
import { cn } from "@/lib/utils";

function NorthstarBadge({ compact }: { compact: boolean }) {
  const badgeId = useId();
  const size = compact ? 34 : 44;
  const coreGradientId = `${badgeId}-core`;
  const ringGradientId = `${badgeId}-ring`;
  const glowFilterId = `${badgeId}-glow`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[18px] border border-[color:var(--app-header-border)] shadow-[var(--app-shadow-soft)]",
        "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-header-surface)_92%,white),color-mix(in_srgb,var(--app-header-surface)_78%,transparent))]"
      )}
      style={{ width: size, height: size }}
    >
      <div className="pointer-events-none absolute inset-[1px] rounded-[16px] bg-[radial-gradient(circle_at_30%_22%,color-mix(in_srgb,var(--app-brand)_35%,white),transparent_36%),linear-gradient(180deg,color-mix(in_srgb,var(--app-brand)_20%,transparent),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_78%,rgba(255,212,110,0.18),transparent_30%)]" />
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="relative z-[1] h-full w-full p-1.5"
      >
        <defs>
          <linearGradient id={coreGradientId} x1="10" x2="38" y1="8" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--app-scene-heading)" />
            <stop offset="0.58" stopColor="var(--app-brand)" />
            <stop offset="1" stopColor="var(--app-brand-strong)" />
          </linearGradient>
          <linearGradient id={ringGradientId} x1="6" x2="42" y1="6" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.82)" />
            <stop offset="0.5" stopColor="rgba(143,206,255,0.55)" />
            <stop offset="1" stopColor="rgba(255,205,118,0.45)" />
          </linearGradient>
          <filter id={glowFilterId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="14.5" fill="none" stroke={`url(#${ringGradientId})`} strokeOpacity="0.52" />
        <circle cx="24" cy="24" r="11" fill="none" stroke="rgba(255,255,255,0.2)" />
        <path
          d="M24 5.5 26.6 19.4 40.5 22 26.6 24.6 24 38.5 21.4 24.6 7.5 22 21.4 19.4 24 5.5Z"
          fill={`url(#${coreGradientId})`}
          filter={`url(#${glowFilterId})`}
        />
        <path d="M24 12.5 25.4 20.6 33.5 22 25.4 23.4 24 31.5 22.6 23.4 14.5 22 22.6 20.6 24 12.5Z" fill="rgba(255,255,255,0.72)" />
        <circle cx="24" cy="24" r="1.8" fill="rgba(255,255,255,0.92)" />
      </svg>
    </div>
  );
}

function NorthstarWordmark() {
  const wordmarkId = useId();
  const starGradientId = `${wordmarkId}-star`;

  return (
    <div className="space-y-0.5">
      <div className="flex items-end gap-1.5 leading-none">
        <span className="font-display text-[1.08rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-scene-heading)]">
          North
        </span>
        <span className="font-display text-[1.08rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-scene-heading)]">
          St
        </span>
        <span className="relative -mb-0.5 inline-flex h-5 w-5 items-center justify-center">
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,223,146,0.3),transparent_68%)] blur-[2px]" />
          <svg viewBox="0 0 24 24" aria-hidden="true" className="relative h-5 w-5 drop-shadow-[0_0_8px_rgba(116,203,255,0.28)]">
            <defs>
              <linearGradient id={starGradientId} x1="4" x2="20" y1="3" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="rgba(255,255,255,0.98)" />
                <stop offset="0.56" stopColor="rgba(149,218,255,0.96)" />
                <stop offset="1" stopColor="rgba(255,207,124,0.88)" />
              </linearGradient>
            </defs>
            <path d="M12 1.5 13.9 9.7 22.5 12 13.9 14.3 12 22.5 10.1 14.3 1.5 12 10.1 9.7 12 1.5Z" fill={`url(#${starGradientId})`} />
          </svg>
        </span>
        <span className="font-display text-[1.08rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-scene-heading)]">
          r
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--app-scene-text)]">
        People Evaluation Workspace
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
    <div className={cn("flex items-center gap-3", className)}>
      <NorthstarBadge compact={compact} />
      {!compact ? <NorthstarWordmark /> : null}
    </div>
  );
}
