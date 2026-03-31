"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { Activity, Blocks, ClipboardList, Menu, RadioTower, Users2 } from "lucide-react";
import { MobileNavDrawer } from "@/components/navigation/MobileNavDrawer";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/design/copy";
import type { AppSession } from "@/lib/auth/session";

type NavItem = { href: Route; label: string; icon: LucideIcon };

export function MainNav({ viewer }: { viewer: Pick<AppSession, "email" | "name" | "role"> | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items: NavItem[] = viewer
    ? [
        { href: "/people/candidates" as Route, label: copy.nav.candidates, icon: Users2 },
        { href: "/addons" as Route, label: copy.nav.addons, icon: Blocks },
        { href: "/assessments" as Route, label: copy.nav.create, icon: ClipboardList },
        { href: "/results", label: copy.nav.results, icon: Activity },
        { href: "/live" as Route, label: copy.nav.run, icon: RadioTower },
        ...(viewer.role === "admin"
          ? [{ href: "/users" as Route, label: copy.nav.users, icon: Users2 }]
          : [])
      ]
    : [{ href: "/live" as Route, label: copy.nav.run, icon: RadioTower }];

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-1.5 rounded-full border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] p-1 text-sm text-slate-200 backdrop-blur-md md:flex">
        {items.map((item) => {
          const Icon = item.icon;
          const href = item.href as string;
          const active =
            pathname === href ||
            (href === "/results" && pathname.startsWith("/results/")) ||
            (href === "/people/candidates" &&
              (pathname.startsWith("/people") || pathname.startsWith("/candidates"))) ||
            (href === "/addons" && pathname.startsWith("/addons")) ||
            (href === "/assessments" && (pathname.startsWith("/assessments") || pathname.startsWith("/create-test"))) ||
            (href === "/live" && (pathname.startsWith("/live") || pathname.startsWith("/run-test"))) ||
            (href === "/users" && pathname.startsWith("/users"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                active
                  ? "bg-[linear-gradient(135deg,rgba(15,168,161,0.28),rgba(15,168,161,0.12))] text-white"
                  : "text-slate-200 hover:bg-[color:var(--app-header-surface-hover)] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] px-3 py-2 text-sm text-slate-100 transition hover:bg-[color:var(--app-header-surface-hover)]"
        >
          <Menu className="h-4 w-4" />
          <span>{viewer ? "Menu" : "Explore"}</span>
        </button>
      </div>

      {viewer ? (
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden rounded-full border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] px-3 py-1.5 text-sm text-slate-200 md:block">
            {viewer.name || viewer.email}
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] px-3 py-1.5 text-sm text-slate-100 transition hover:bg-[color:var(--app-header-surface-hover)]"
            >
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] px-3 py-1.5 text-sm text-slate-100 transition hover:bg-[color:var(--app-header-surface-hover)]"
          >
            Log in
          </Link>
        </div>
      )}

      <MobileNavDrawer
        open={mobileOpen}
        items={items}
        pathname={pathname}
        viewer={viewer}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}
