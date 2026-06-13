"use client";

import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { isNavItemActive } from "@/components/navigation/nav-config";
import { WORKSPACE_SUBITEMS, CANDIDATE_STAGES, isWorkspaceSubnavItemActive } from "@/components/navigation/WorkspaceSubnav";
import type { AppSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export function MobileNavDrawer({
  open,
  items,
  pathname,
  viewer,
  departmentId,
  departmentName,
  onClose
}: {
  open: boolean;
  items: Array<{ href: Route; label: string; icon: LucideIcon }>;
  pathname: string;
  viewer: Pick<AppSession, "email" | "name" | "permissions" | "departmentId"> | null;
  departmentId?: string;
  departmentName?: string;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const currentPathname = usePathname();
  const workspaceId = searchParams?.get("workspaceId");
  const currentStage = searchParams?.get("stage");

  const candidatesBaseHref = departmentId ? `/departments/${departmentId}/candidates` : "";
  const isOnCandidatesPath = departmentId ? currentPathname.startsWith(candidatesBaseHref) : false;
  const [candidatesExpanded, setCandidatesExpanded] = useState(isOnCandidatesPath);

  if (!open) return null;

  const isAdmin = viewer?.permissions.includes("manage_users") ?? false;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "var(--app-modal-overlay)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 h-full w-[min(86vw,320px)] flex flex-col border-l border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--app-border)] px-5 py-4">
          <div className="space-y-2.5">
            <AppLogo compact />
            {viewer && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[color:var(--app-brand)]">
                  {departmentName ?? (isAdmin ? "Admin Workspace" : "Workspace")}
                </p>
                <p className="text-sm font-medium text-[color:var(--app-heading)]">{viewer.name || viewer.email}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="mt-0.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-2 text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable nav content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {/* Global nav items (admin workspace) */}
          {items.length > 0 && (
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item.href as string);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5 text-sm font-medium transition",
                      active
                        ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)]"
                        : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-muted)]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Department subnav */}
          {departmentId && (
            <div className={cn("space-y-0.5", items.length > 0 && "mt-4 border-t border-[color:var(--app-border)] pt-4")}>
              <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.22em] font-semibold text-[color:var(--app-muted)]">
                {departmentName ?? "Workspace"}
              </p>
              {WORKSPACE_SUBITEMS.map((item) => {
                const Icon = item.icon;
                const href = item.href.replace("{id}", departmentId) as Route;
                const isExpandable = "expandable" in item && item.expandable;
                const isActive = isExpandable
                  ? isOnCandidatesPath
                  : isWorkspaceSubnavItemActive({ itemKey: item.key, href, pathname: currentPathname, departmentId, workspaceId });

                if (isExpandable) {
                  return (
                    <div key={item.key}>
                      <div
                        className={cn(
                          "flex items-center rounded-[14px] border transition",
                          isActive
                            ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)]"
                            : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)]"
                        )}
                      >
                        <Link href={href} onClick={onClose} className="flex flex-1 items-center gap-3 px-3.5 py-2.5 text-sm font-medium">
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCandidatesExpanded((v) => !v)}
                          className="flex items-center px-2.5 py-2.5"
                          aria-label={candidatesExpanded ? "Collapse" : "Expand"}
                        >
                          <ChevronDown className={cn("h-3.5 w-3.5 opacity-50 transition-transform duration-200", candidatesExpanded ? "rotate-0" : "-rotate-90")} />
                        </button>
                      </div>

                      {candidatesExpanded && (
                        <div className="mt-0.5 ml-3 space-y-0.5 border-l border-[color:var(--app-border)] pl-3">
                          {CANDIDATE_STAGES.map((stage) => {
                            const stageHref = `${candidatesBaseHref}?stage=${stage.stage}` as Route;
                            const isStageActive = isOnCandidatesPath && currentStage === stage.stage;
                            return (
                              <Link
                                key={stage.key}
                                href={stageHref}
                                onClick={onClose}
                                className={cn(
                                  "flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-[13px] font-medium transition",
                                  isStageActive
                                    ? "bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)]"
                                    : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-text)]"
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isStageActive ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-border)]")} />
                                {stage.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5 text-sm font-medium transition",
                      isActive
                        ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)]"
                        : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-muted)]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[color:var(--app-border)] px-4 pb-5 pt-4">
          {viewer ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="block rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-center text-sm font-medium text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
            >
              Log in
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
