"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { WorkspaceSelector, type Department } from "@/components/navigation/WorkspaceSelector";
import { WorkspaceSubnav } from "@/components/navigation/WorkspaceSubnav";
import { getNavItems, isNavItemActive } from "@/components/navigation/nav-config";
import type { AppSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "northstar-rail-collapsed";

type SearchParamReader = {
  get(name: string): string | null;
};

function routeWorkspaceDepartmentId(pathname: string) {
  return pathname.match(/^\/departments\/([^/]+)/)?.[1];
}

export function resolveCurrentWorkspace({
  pathname,
  searchParams,
  isAdmin,
  visibleDepartments
}: {
  pathname: string;
  searchParams?: SearchParamReader | null;
  isAdmin: boolean;
  visibleDepartments: Department[];
}) {
  // 1. Route segment always wins: /departments/[id]/...
  const routedDepartmentId = routeWorkspaceDepartmentId(pathname);
  if (routedDepartmentId) {
    return routedDepartmentId;
  }

  // 2. Explicit workspaceId search param for workspace-scoped cross-route pages
  const workspaceId = searchParams?.get("workspaceId")?.trim() || undefined;
  if (workspaceId && visibleDepartments.some((department) => department.isActive && department.id === workspaceId)) {
    return workspaceId;
  }

  // 3. Explicit departmentId search param (e.g. /people/candidates/new?departmentId=ba-sl)
  //    Resolves the workspace to that department so the rail stays on the correct workspace
  //    instead of defaulting to Admin Workspace.
  const paramDepartmentId = searchParams?.get("departmentId")?.trim() || undefined;
  if (paramDepartmentId && visibleDepartments.some((department) => department.isActive && department.id === paramDepartmentId)) {
    return paramDepartmentId;
  }

  // 4. Admin routes (only when no explicit department context present)
  const isAdminRoute =
    pathname === "/departments" ||
    pathname.startsWith("/people/") ||
    pathname.startsWith("/assessments") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/access-roles") ||
    pathname.startsWith("/integrations") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/create-test") ||
    pathname.startsWith("/addons");
  if (isAdminRoute && isAdmin) {
    return "admin";
  }

  return undefined;
}

export function WorkspaceRail({
  viewer,
  departments = []
}: {
  viewer: Pick<AppSession, "email" | "name" | "roleId" | "permissions" | "departmentId"> | null;
  departments?: Department[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = viewer?.permissions.includes("manage_users") ?? false;

  // Filter departments: admins see all, department-scoped users see only their department
  const visibleDepartments = isAdmin
    ? departments
    : viewer?.departmentId
      ? departments.filter((d) => d.id === viewer.departmentId)
      : [];
  const currentWorkspace = resolveCurrentWorkspace({
    pathname,
    searchParams,
    isAdmin,
    visibleDepartments
  });

  const currentDeptName = currentWorkspace && currentWorkspace !== "admin"
    ? visibleDepartments.find((d) => d.id === currentWorkspace)?.name
    : undefined;

  // Get nav items for current workspace
  const items = getNavItems(viewer, currentWorkspace);

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
            {/* Workspace Selector - shows current workspace and switcher */}
            {currentWorkspace && (
              <WorkspaceSelector
                currentWorkspace={currentWorkspace}
                departments={visibleDepartments}
                isAdmin={isAdmin}
                collapsed={collapsed}
              />
            )}

            {/* Workspace Subitems - shows navigation for selected department workspace */}
            {currentWorkspace && currentWorkspace !== "admin" && (
              <div className="mt-4 pt-4 border-t border-[color:var(--app-border)]">
                <WorkspaceSubnav
                  departmentId={currentWorkspace}
                  collapsed={collapsed}
                  departmentName={currentDeptName}
                />
              </div>
            )}

            {/* Main Navigation - global items */}
            <nav className={cn(
              "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1",
              viewer?.departmentId ? "mt-4 pt-4 border-t border-[color:var(--app-border)]" : "mt-2"
            )}>
              {items.map((item, index) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item.href as string);
                const prevItem = index > 0 ? items[index - 1] : null;
                const showSectionLabel = !collapsed && item.section && item.section !== prevItem?.section;

                return (
                  <div key={`${item.href}-group`}>
                    {showSectionLabel && (
                      <p className={cn(
                        "px-3 pb-1.5 text-[10px] uppercase tracking-[0.22em] font-semibold text-[color:var(--app-scene-text)]/50",
                        index === 0 ? "pt-0.5" : "pt-4"
                      )}>
                        {item.section}
                      </p>
                    )}
                    {/* Tooltip wrapper for collapsed state */}
                    <div className="group/tip relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center rounded-[14px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
                          collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                          active
                            ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]"
                            : "border-transparent text-[color:var(--app-scene-text)] hover:border-white/12 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className={cn("text-sm font-medium transition-all duration-200", collapsed ? "hidden" : "block")}>
                          {item.label}
                        </span>
                      </Link>
                      {/* CSS tooltip — only shown in collapsed mode */}
                      {collapsed && (
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute left-full top-1/2 z-[200] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--app-heading)] opacity-0 shadow-xl transition-opacity duration-100 group-hover/tip:opacity-100"
                        >
                          {item.label}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="mt-auto -mx-4 border-t border-[color:var(--app-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.09))] px-4 pb-5 pt-4 backdrop-blur-md">
              {viewer ? (
                <div className="space-y-2">
                  <div
                    className={cn(
                      "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)] transition-all duration-300",
                      collapsed ? "p-3" : "p-3.5"
                    )}
                  >
                    {collapsed ? (
                      <div className="group/tip relative flex justify-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--app-brand)]/15 text-sm font-semibold text-[color:var(--app-brand)]">
                          {viewer.name?.slice(0, 1).toUpperCase() || viewer.email.slice(0, 1).toUpperCase()}
                        </div>
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute left-full top-1/2 z-[200] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--app-heading)] opacity-0 shadow-xl transition-opacity duration-100 group-hover/tip:opacity-100"
                        >
                          {viewer.name || viewer.email}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--app-brand)]/15 text-sm font-semibold text-[color:var(--app-brand)]">
                          {viewer.name?.slice(0, 1).toUpperCase() || viewer.email.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-tight text-[color:var(--app-heading)]">
                            {viewer.name || viewer.email}
                          </p>
                          <p className="text-[11px] text-[color:var(--app-muted)] leading-tight mt-0.5">
                            {isAdmin ? "Administrator" : "Member"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="group/tip relative">
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        className={cn(
                          "inline-flex w-full items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-sm text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)] transition-all duration-200 hover:bg-[color:var(--app-surface-soft)]",
                          collapsed ? "justify-center p-3" : "gap-2 px-4 py-2.5"
                        )}
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span className={cn("transition-all duration-200", collapsed ? "hidden" : "block")}>Log out</span>
                      </button>
                    </form>
                    {collapsed && (
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute left-full top-1/2 z-[200] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--app-heading)] opacity-0 shadow-xl transition-opacity duration-100 group-hover/tip:opacity-100"
                      >
                        Log out
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="group/tip relative">
                  <Link
                    href="/login"
                    className={cn(
                      "inline-flex w-full items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-sm text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)] transition-all duration-200 hover:bg-[color:var(--app-surface-soft)]",
                      collapsed ? "justify-center p-3" : "gap-2 px-4 py-2.5"
                    )}
                  >
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span className={cn("transition-all duration-200", collapsed ? "hidden" : "block")}>Log in</span>
                  </Link>
                  {collapsed && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-full top-1/2 z-[200] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--app-heading)] opacity-0 shadow-xl transition-opacity duration-100 group-hover/tip:opacity-100"
                    >
                      Log in
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
