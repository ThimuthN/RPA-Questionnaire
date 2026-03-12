import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AmbientCanvasLayer } from "@/components/scene/AmbientCanvasLayer";

type SceneVariant = "create" | "run" | "results";

const sceneClasses: Record<SceneVariant, string> = {
  create:
    "bg-[radial-gradient(circle_at_top_left,rgba(47,134,255,0.16),transparent_30%),linear-gradient(180deg,rgba(16,39,73,0.86),rgba(5,11,22,0.96))]",
  run:
    "bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(18,179,168,0.12),transparent_24%),linear-gradient(180deg,rgba(10,24,48,0.94),rgba(5,11,22,0.98))]",
  results:
    "bg-[radial-gradient(circle_at_top_right,rgba(47,134,255,0.12),transparent_24%),radial-gradient(circle_at_left,rgba(230,160,25,0.08),transparent_22%),linear-gradient(180deg,rgba(11,18,31,0.94),rgba(5,11,22,0.99))]"
};

export function SceneShell({
  variant,
  title,
  eyebrow,
  subtitle,
  utility,
  className,
  children
}: PropsWithChildren<{
  variant: SceneVariant;
  title: ReactNode;
  eyebrow: string;
  subtitle?: string;
  utility?: ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] border border-white/10 px-5 py-6 shadow-strong md:px-8 md:py-8",
        sceneClasses[variant],
        className
      )}
    >
      <AmbientCanvasLayer variant={variant} className="opacity-55" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_38%,transparent_60%,rgba(255,255,255,0.03))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/12" />

      <header className="relative z-10 mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand-300">{eyebrow}</p>
          <h1 className="max-w-3xl font-display text-4xl leading-[0.96] text-white md:text-5xl">{title}</h1>
          {subtitle ? <p className="max-w-xl text-sm text-slate-300">{subtitle}</p> : null}
        </div>
        {utility ? <div className="relative z-10">{utility}</div> : null}
      </header>

      <div className="relative z-10">{children}</div>
    </section>
  );
}
