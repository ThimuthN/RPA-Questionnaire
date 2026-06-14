import Link from "next/link";
import type { Route } from "next";

export type ActiveFilterChipItem = {
  label: string;
  clearHref: Route;
};

export function ActiveFilterChips({
  items,
  clearAllHref,
  title = "Active filters"
}: {
  items: ActiveFilterChipItem[];
  clearAllHref: Route;
  title?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
          {title}
        </span>
        {items.map((item) => (
          <Link
            key={`${item.label}-${item.clearHref}`}
            href={item.clearHref}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1.5 text-xs font-medium text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:text-[color:var(--app-heading)]"
          >
            <span>{item.label}</span>
            <span aria-hidden="true" className="text-[color:var(--app-muted)]">
              ×
            </span>
          </Link>
        ))}
        <Link
          href={clearAllHref}
          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-[color:var(--app-muted)] transition hover:text-[color:var(--app-heading)]"
        >
          Clear all
        </Link>
      </div>
    </div>
  );
}
