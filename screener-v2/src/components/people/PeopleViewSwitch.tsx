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
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] p-1 text-sm text-slate-200 backdrop-blur-md">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "rounded-full px-3 py-1.5 transition",
            current === item.key
              ? "bg-[linear-gradient(135deg,rgba(31,111,255,0.24),rgba(47,134,255,0.12))] text-white shadow-[0_12px_28px_rgba(31,111,255,0.18)]"
              : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
