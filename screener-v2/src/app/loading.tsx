import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(47,134,255,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(18,179,168,0.14),transparent_20%),linear-gradient(180deg,rgba(10,20,40,0.94),rgba(5,11,22,0.98))] px-8 py-12 shadow-strong">
        <div className="loading-grid absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]" />
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex justify-center">
            <div className="relative h-[190px] w-[190px]">
              <div className="brand-orbit absolute inset-[6%] rounded-full border border-brand-300/30" />
              <div className="brand-orbit-reverse absolute inset-[18%] rounded-full border border-teal-300/20" />
              <div className="absolute left-[10%] top-[18%] h-3 w-3 rounded-full bg-white/80 brand-spark" />
              <div className="absolute bottom-[16%] right-[12%] h-2.5 w-2.5 rounded-full bg-teal-300 brand-spark [animation-delay:240ms]" />
              <div className="absolute inset-[22%] overflow-hidden rounded-[32%] border border-white/10 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.18),transparent_42%),linear-gradient(180deg,rgba(98,142,173,0.96),rgba(26,59,82,0.98))] p-5 shadow-[0_24px_56px_rgba(6,14,28,0.3)]">
                <div className="absolute inset-x-[18%] top-[8%] h-8 rounded-full bg-white/10 blur-xl" />
                <Image src="/brand/northstar-icon-clean.png" alt="" fill sizes="120px" className="northstar-asset object-contain p-6" priority />
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-[11px] uppercase tracking-[0.34em] text-brand-300">Northstar loading</p>
            <h2 className="mt-3 font-display text-3xl text-white md:text-4xl">Tracking the next scene</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-[15px]">
              Pulling together people, reviews, and results so everything lands in one place.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Track", "Review", "Decide"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[color:var(--app-scene-text)]"
                >
                  <span className="system-online-dot h-1.5 w-1.5 rounded-full bg-brand-300 shadow-[0_0_12px_rgba(138,184,255,0.45)]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex w-full max-w-md gap-2">
                <div className="loading-bar h-2 flex-1 rounded-full bg-white/8" />
                <div className="loading-bar h-2 w-16 rounded-full bg-white/8 [animation-delay:140ms]" />
                <div className="loading-bar h-2 w-10 rounded-full bg-white/8 [animation-delay:280ms]" />
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.18em] text-[color:var(--app-scene-muted)] lg:justify-start">
                <span>People</span>
                <span>Assessments</span>
                <span>Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
