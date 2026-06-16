import Image from "next/image";

/**
 * Calm, enterprise-grade loading state — a single branded mark with a soft
 * pulsing ring and one slim indeterminate track. Fully theme-aware (drives off
 * --app-* tokens) so it is seamless in light and dark. Shared by route-level
 * loading.tsx fallbacks; list pages use their own skeletons instead.
 */
export function BrandLoader({
  title = "Loading your workspace",
  subtitle = "Bringing your jobs, candidates, and decisions together.",
  minHeight = "min-h-[60vh]"
}: {
  title?: string;
  subtitle?: string;
  minHeight?: string;
}) {
  return (
    <div className={`grid ${minHeight} place-items-center px-6`}>
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Brand mark with soft concentric pulse rings */}
        <div className="relative mb-7 grid h-20 w-20 place-items-center">
          <span className="brand-loader-ring absolute inset-0 rounded-[24px] border border-[color:var(--app-brand)]/30" />
          <span className="brand-loader-ring absolute inset-0 rounded-[24px] border border-[color:var(--app-brand)]/20 [animation-delay:700ms]" />
          <span className="relative grid h-14 w-14 place-items-center rounded-[18px] border border-[color:var(--app-brand)]/25 bg-[color:var(--app-brand-soft)] shadow-[0_10px_30px_color-mix(in_srgb,var(--app-brand)_22%,transparent)]">
            <Image
              src="/brand/northstar-icon-clean.png"
              alt=""
              width={32}
              height={32}
              className="northstar-asset h-8 w-8 object-contain"
              priority
            />
          </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--app-brand)]">Northstar</p>
        <h1 className="mt-2 font-display text-xl text-[color:var(--app-heading)]">{title}</h1>
        <p className="mt-1.5 text-sm leading-6 text-[color:var(--app-muted)]">{subtitle}</p>

        {/* Single slim indeterminate track */}
        <div className="mt-6 h-1 w-44 overflow-hidden rounded-full bg-[color:var(--app-surface-soft)]">
          <span className="brand-loader-indeterminate block h-full w-1/3 rounded-full bg-[color:var(--app-brand)]" />
        </div>
      </div>
    </div>
  );
}
