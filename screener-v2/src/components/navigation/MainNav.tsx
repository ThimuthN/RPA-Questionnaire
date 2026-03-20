"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/design/copy";
import type { AppSession } from "@/lib/auth/session";

export function MainNav({ viewer }: { viewer: Pick<AppSession, "email" | "name" | "role"> | null }) {
  const pathname = usePathname();
  const items: Array<{ href: Route; label: string }> = viewer
    ? [
        { href: "/candidates" as Route, label: copy.nav.candidates },
        { href: "/create-test", label: copy.nav.create },
        { href: "/run-test", label: copy.nav.run },
        { href: "/results", label: copy.nav.results },
        ...(viewer.role === "admin" ? [{ href: "/users" as Route, label: copy.nav.users }] : [])
      ]
    : [{ href: "/run-test", label: copy.nav.run }];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm text-slate-200 backdrop-blur-md">
        {items.map((item) => {
          const href = item.href as string;
          const active =
            pathname === href ||
            (href === "/results" && pathname.startsWith("/results/")) ||
            (href === "/candidates" && pathname.startsWith("/candidates")) ||
            (href === "/create-test" && pathname.startsWith("/create-test")) ||
            (href === "/run-test" && pathname.startsWith("/run-test")) ||
            (href === "/users" && pathname.startsWith("/users"));
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

      {viewer ? (
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200 md:block">
            {viewer.name || viewer.email}
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-white/16 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-100 transition hover:bg-white/[0.08]"
            >
              Log out
            </button>
          </form>
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded-full border border-white/16 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-100 transition hover:bg-white/[0.08]"
        >
          Log in
        </Link>
      )}
    </div>
  );
}
