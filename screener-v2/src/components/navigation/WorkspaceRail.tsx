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
    <div
      className={cn(
        "northstar-ribbon-shell hidden md:block md:shrink-0 md:self-stretch md:border-r md:border-[color:var(--app-border)] md:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface)_86%,white),var(--app-surface-soft))] md:backdrop-blur-xl transition-all duration-300 ease-out",
        collapsed ? "md:w-[92px]" : "md:w-[280px]"
      )}
    >
      <aside
        className={cn(
          "hidden md:sticky md:top-0 md:flex md:h-screen md:max-h-screen md:flex-col"
        )}
      >
        <div className="flex h-full min-h-full flex-col gap-0 px-4 py-5">
          <div className="flex items-center justify-between gap-3 min-h-10">
            <div className={cn("transition-all duration-300", collapsed && "flex-1")}>
              <Link href="/" className="inline-flex transition hover:opacity-95">
                <AppLogo compact={collapsed} />
              </Link>
            </div>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed(!collapsed)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/16 bg-white/10 text-[color:var(--app-scene-text)] shadow-[var(--app-shadow-soft)] transition-all duration-300 hover:bg-white/18 hover:text-white"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          <div className="h-2" />

          <div className="flex min-h-0 flex-1 flex-col">
            <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
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
                      "group flex items-center rounded-[20px] border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
                      collapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                      active
                        ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]"
                        : "border-transparent text-[color:var(--app-scene-text)] hover:border-white/18 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={cn("text-sm font-medium transition-all duration-300", collapsed ? "hidden" : "block")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto -mx-4 border-t border-[color:var(--app-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.09))] px-4 pb-5 pt-4 backdrop-blur-md">
              {viewer ? (
                <div className="space-y-2">
                  <div
                    className={cn(
                      "rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)] transition-all duration-300",
                      collapsed ? "p-3" : "p-4"
                    )}
                  >
                    {collapsed ? (
                      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-brand)]">
                        {viewer.name?.slice(0, 1) || viewer.email.slice(0, 1)}
                      </p>
                    ) : (
                      <div className="space-y-1 transition-all duration-300">
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
                        "inline-flex w-full items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-sm text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)] transition-all duration-300 hover:bg-[color:var(--app-surface-soft)]",
                        collapsed ? "justify-center p-3" : "gap-2 px-4 py-3"
                      )}
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span className={cn("transition-all duration-300", collapsed ? "hidden" : "block")}>Log out</span>
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  aria-label={collapsed ? "Log in" : undefined}
                  title={collapsed ? "Log in" : undefined}
                  className={cn(
                    "inline-flex w-full items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-sm text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)] transition-all duration-300 hover:bg-[color:var(--app-surface-soft)]",
                    collapsed ? "justify-center p-3" : "gap-2 px-4 py-3"
                  )}
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span className={cn("transition-all duration-300", collapsed ? "hidden" : "block")}>Log in</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
