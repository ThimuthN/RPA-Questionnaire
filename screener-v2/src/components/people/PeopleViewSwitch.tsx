import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

type PeopleView = "candidates" | "employees";

const items: Array<{ key: PeopleView; label: string; href: Route }> = [
  { key: "candidates", label: "Candidates", href: "/people/candidates" as Route },
  { key: "employees", label: "Employees", href: "/people/employees" as Route }
];

export function PeopleViewSwitch({ current }: { current: PeopleView }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-1 text-sm text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)]">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "rounded-full px-3 py-1.5 transition",
            current === item.key
              ? "bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--app-brand)_22%,transparent)]"
              : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
