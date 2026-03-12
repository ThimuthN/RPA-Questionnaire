"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/design/copy";

const items: Array<{ href: Route; label: string }> = [
  { href: "/create-test", label: copy.nav.create },
  { href: "/run-test", label: copy.nav.run },
  { href: "/results", label: copy.nav.results }
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm text-slate-200 backdrop-blur-md">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/results" && pathname.startsWith("/results/")) ||
          (item.href === "/create-test" && pathname.startsWith("/create-test")) ||
          (item.href === "/run-test" && pathname.startsWith("/run-test"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
              active
                ? "bg-[linear-gradient(135deg,rgba(31,111,255,0.24),rgba(47,134,255,0.12))] text-white"
                : "text-slate-200 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
