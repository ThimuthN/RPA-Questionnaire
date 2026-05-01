"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { getNavItems, isNavItemActive } from "@/components/navigation/nav-config";
import type { AppSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "northstar-rail-collapsed";

export function WorkspaceRail({
  viewer
}: {
  viewer: Pick<AppSession, "email" | "name" | "role"> | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = getNavItems(viewer);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "hidden md:flex md:sticky md:top-0 md:h-screen md:flex-col md:border-r md:border-[color:var(--app-border)] md:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface)_86%,white),var(--app-surface-soft))] md:backdrop-blur-xl",
        collapsed ? "md:w-[92px]" : "md:w-[280px]"
      )}
    >
      <div className="flex h-full flex-col gap-6 px-4 py-5">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-3")}>
          <Link href="/" className="transition hover:opacity-95">
            <AppLogo compact={collapsed} />
          </Link>
          {!collapsed ? (
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:bg-[color:var(--app-surface-soft)]"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
          {collapsed ? (
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={() => setCollapsed(false)}
              className="absolute left-1/2 top-20 inline-flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:bg-[color:var(--app-surface-soft)]"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item.href as string);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center rounded-[20px] border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                  active
                    ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]"
                    : "border-transparent text-[color:var(--app-muted)] hover:border-[color:var(--app-border)] hover:bg-[color:var(--app-surface)] hover:text-[color:var(--app-heading)]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[color:var(--app-border)] pt-4">
          {viewer ? (
            <div className="space-y-3">
              <div
                className={cn(
                  "rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)]",
                  collapsed ? "p-3" : "p-4"
                )}
              >
                {collapsed ? (
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-brand)]">
                    {viewer.name?.slice(0, 1) || viewer.email.slice(0, 1)}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Workspace user</p>
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">{viewer.name || viewer.email}</p>
                    <p className="text-xs text-[color:var(--app-muted)]">{viewer.role}</p>
                  </div>
                )}
              </div>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  aria-label={collapsed ? "Log out" : undefined}
                  title={collapsed ? "Log out" : undefined}
                  className={cn(
                    "inline-flex w-full items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-sm text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)] transition hover:bg-[color:var(--app-surface-soft)]",
                    collapsed ? "justify-center px-0 py-3" : "gap-2 px-4 py-3"
                  )}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span>Log out</span> : null}
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label={collapsed ? "Log in" : undefined}
              title={collapsed ? "Log in" : undefined}
              className={cn(
                "inline-flex w-full items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-sm text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)] transition hover:bg-[color:var(--app-surface-soft)]",
                collapsed ? "justify-center px-0 py-3" : "gap-2 px-4 py-3"
              )}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Log in</span> : null}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
