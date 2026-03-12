import Link from "next/link";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/design/copy";

export function StudioTabs({ current }: { current: "create" | "run" | "results" }) {
  const items = [
    { id: "create", label: copy.nav.create, href: "/create-test" },
    { id: "run", label: copy.nav.run, href: "/run-test" },
    { id: "results", label: "Results", href: "/results" }
  ] as const;

  return (
    <nav className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
      {items.map((item) => {
        const active = current === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
              active ? "bg-brand-500/25 text-white" : "text-slate-300 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
