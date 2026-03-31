import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AmbientCanvasLayer } from "@/components/scene/AmbientCanvasLayer";

type SceneVariant = "create" | "run" | "results";
type SceneTone = "scene" | "page";

const sceneClasses: Record<SceneVariant, string> = {
  create:
    "bg-[radial-gradient(circle_at_top_left,rgba(47,134,255,0.18),transparent_30%),radial-gradient(circle_at_78%_14%,rgba(157,140,255,0.10),transparent_22%),linear-gradient(180deg,rgba(16,39,73,0.84),rgba(5,11,22,0.96))]",
  run:
    "bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(18,179,168,0.14),transparent_24%),linear-gradient(180deg,rgba(10,24,48,0.94),rgba(5,11,22,0.98))]",
  results:
    "bg-[radial-gradient(circle_at_top_right,rgba(47,134,255,0.14),transparent_24%),radial-gradient(circle_at_left,rgba(230,160,25,0.10),transparent_22%),radial-gradient(circle_at_78%_24%,rgba(111,215,255,0.07),transparent_18%),linear-gradient(180deg,rgba(11,18,31,0.94),rgba(5,11,22,0.99))]"
};

export function SceneShell({
  variant,
  title,
  eyebrow,
  subtitle,
  utility,
  tone = "scene",
  className,
  children
}: PropsWithChildren<{
  variant: SceneVariant;
  title: ReactNode;
  eyebrow: string;
  subtitle?: string;
  utility?: ReactNode;
  tone?: SceneTone;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "relative isolate md:px-9 md:py-9",
        tone === "scene" &&
          "overflow-hidden rounded-[32px] border border-[color:var(--app-border)] px-6 py-7 shadow-[var(--app-shadow)]",
        tone === "scene" && sceneClasses[variant],
        tone === "page" && "px-0 py-0",
        className
      )}
    >
      {tone === "scene" ? <AmbientCanvasLayer variant={variant} className="opacity-55" /> : null}
      {tone === "scene" ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_36%,transparent_60%,rgba(111,215,255,0.03))]" />
          <div className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_0_1px_rgba(255,255,255,0.02)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/12" />
        </>
      ) : null}

      <header
        className={cn(
          "relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,auto)] lg:items-end",
          tone === "scene" ? "mb-8" : "mb-6"
        )}
      >
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--app-brand)]">{eyebrow}</p>
          <h1 className="max-w-3xl font-display text-4xl leading-[0.96] text-[color:var(--app-heading)] md:text-5xl">{title}</h1>
          {subtitle ? <p className="max-w-2xl text-sm leading-6 text-[color:var(--app-muted)]">{subtitle}</p> : null}
        </div>
        {utility ? <div className="relative z-10 flex flex-wrap items-center gap-2 lg:justify-self-end">{utility}</div> : null}
      </header>

      <div className="relative z-10">{children}</div>
    </section>
  );
}
