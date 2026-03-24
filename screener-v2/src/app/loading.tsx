import { OrbitMascot } from "@/components/brand/OrbitMascot";

export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.18),transparent_28%),linear-gradient(180deg,rgba(10,20,40,0.94),rgba(5,11,22,0.98))] px-8 py-12 shadow-strong">
        <div className="loading-grid absolute inset-0 opacity-50" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <OrbitMascot size="xl" className="mb-6" />
          <p className="text-[11px] uppercase tracking-[0.34em] text-brand-300">Preparing workspace</p>
          <h2 className="mt-3 font-display text-3xl text-white">Spinning up your next scene</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
            Loading dashboards, candidates, and scoring surfaces so the handoff feels smooth.
          </p>
          <div className="mt-7 flex w-full max-w-sm gap-2">
            <div className="loading-bar h-2 flex-1 rounded-full bg-white/8" />
            <div className="loading-bar h-2 w-16 rounded-full bg-white/8 [animation-delay:140ms]" />
            <div className="loading-bar h-2 w-10 rounded-full bg-white/8 [animation-delay:280ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
