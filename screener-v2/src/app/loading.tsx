import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-8 py-12 shadow-[var(--app-shadow-soft)]">
        {/* Brand wash + grid — both theme-aware so the screen is seamless in light and dark */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_8%,color-mix(in_srgb,var(--app-brand)_14%,transparent),transparent_46%),radial-gradient(ellipse_at_85%_12%,color-mix(in_srgb,var(--app-brand)_8%,transparent),transparent_40%)]" />
        <div className="loading-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--app-brand)_55%,transparent),transparent)]" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center lg:flex-row lg:gap-10 lg:text-left">
          {/* Orbiting brand mark */}
          <div className="relative h-[156px] w-[156px] shrink-0">
            <div className="brand-orbit absolute inset-[4%] rounded-full border border-[color:var(--app-brand)]/30" />
            <div className="brand-orbit-reverse absolute inset-[18%] rounded-full border border-[color:var(--app-brand)]/15" />
            <div className="brand-spark absolute left-[8%] top-[16%] h-2.5 w-2.5 rounded-full bg-[color:var(--app-brand)]" />
            <div className="brand-spark absolute bottom-[14%] right-[10%] h-2 w-2 rounded-full bg-[color:var(--app-brand)] [animation-delay:240ms]" />
            <div className="absolute inset-[24%] overflow-hidden rounded-[28%] border border-[color:var(--app-brand)]/25 bg-[color:var(--app-brand-soft)] shadow-[0_18px_44px_color-mix(in_srgb,var(--app-brand)_20%,transparent)]">
              <Image src="/brand/northstar-icon-clean.png" alt="" fill sizes="120px" className="northstar-asset object-contain p-5" priority />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.34em] text-[color:var(--app-brand)]">Northstar</p>
            <h2 className="mt-3 font-display text-2xl text-[color:var(--app-heading)] md:text-3xl">Loading your workspace</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--app-muted)]">
              Pulling together jobs, candidates, assessments, and decisions so hiring work lands in one place.
            </p>

            <div className="mt-6 flex w-full max-w-sm gap-2">
              <div className="loading-bar h-2 flex-1 rounded-full bg-[color:var(--app-surface-soft)]" />
              <div className="loading-bar h-2 w-16 rounded-full bg-[color:var(--app-surface-soft)] [animation-delay:140ms]" />
              <div className="loading-bar h-2 w-10 rounded-full bg-[color:var(--app-surface-soft)] [animation-delay:280ms]" />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Track", "Review", "Decide"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[color:var(--app-muted)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--app-brand)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
