import type { ReactNode } from "react";

export function DashboardSectionHeader({
  eyebrow,
  title,
  description,
  meta,
  action
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        {eyebrow ? <p className="text-[11px] uppercase tracking-[0.2em] text-brand-300">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl text-white">{title}</h2>
          {meta}
        </div>
        {description ? <p className="max-w-3xl text-sm text-slate-300">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
