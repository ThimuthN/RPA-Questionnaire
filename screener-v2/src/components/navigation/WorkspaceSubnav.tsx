"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Briefcase,
  ClipboardList,
  Users2,
  Users,
  Lock,
  FileCheck,
  Tag,
  Settings,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CANDIDATE_STAGES = [
  { key: "pipeline", label: "Pipeline", stage: "pipeline" },
  { key: "screening", label: "Screening", stage: "screening" },
  { key: "interview", label: "Interview", stage: "interview" },
  { key: "review", label: "Review", stage: "advanced_review" },
  { key: "final", label: "Final", stage: "finalized" }
] as const;

export const WORKFLOW_ITEMS = [
  { key: "overview", label: "Overview", icon: Home, href: "/departments/{id}" },
  { key: "jobs", label: "Jobs", icon: Briefcase, href: "/departments/{id}/jobs" },
  { key: "applicants", label: "Applicants", icon: ClipboardList, href: "/departments/{id}/applicants" },
  { key: "candidates", label: "Candidates", icon: Users2, href: "/departments/{id}/candidates", expandable: true as const },
  { key: "assessments", label: "Assessments", icon: FileCheck, href: "/departments/{id}/assessments" }
] as const;

export const SETTINGS_ITEMS = [
  {
    key: "team",
    label: "Team",
    icon: Users,
    href: "/departments/{id}/users",
    subitems: [
      { key: "my-team", label: "My team", href: "/departments/{id}/users" },
      { key: "hiring-templates", label: "Hiring templates", href: "/departments/{id}/hiring-templates" },
      { key: "offer-approvals", label: "Offer approvals", href: "/departments/{id}/offer-approval-chain", badge: true }
    ]
  },
  {
    key: "access",
    label: "Access",
    icon: Lock,
    href: "/departments/{id}/access",
    subitems: [
      { key: "access-control", label: "Access Control", href: "/departments/{id}/access", exact: true },
      { key: "app-integrations", label: "App Integrations", href: "/departments/{id}/access/integrations" }
    ]
  },
  {
    key: "designations",
    label: "Roles",
    icon: Tag,
    href: "/departments/{id}/designations",
    subitems: null
  }
] as const;

// Backward-compat flat export used by MobileNavDrawer
export const WORKSPACE_SUBITEMS = [
  ...WORKFLOW_ITEMS,
  ...(SETTINGS_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    href: item.href
  })))
] as const;

function isAssessmentWorkspacePath(pathname: string, departmentId: string, workspaceId?: string | null) {
  return (
    workspaceId === departmentId &&
    (pathname.startsWith("/assessments") ||
      pathname.startsWith("/create-test") ||
      pathname.startsWith("/addons") ||
      pathname.startsWith("/results"))
  );
}

function isCrossRouteActive(itemKey: string, pathname: string, departmentId: string, workspaceId?: string | null) {
  if (workspaceId !== departmentId) return false;
  if (itemKey === "applicants" && pathname.startsWith("/people/candidates/applicants")) return true;
  if (itemKey === "jobs" && pathname.startsWith("/people/candidates/jobs")) return true;
  if (
    itemKey === "candidates" &&
    pathname.startsWith("/people/candidates") &&
    !pathname.startsWith("/people/candidates/applicants") &&
    !pathname.startsWith("/people/candidates/jobs")
  ) return true;
  return false;
}

export function isWorkspaceSubnavItemActive({
  itemKey,
  href,
  pathname,
  departmentId,
  workspaceId
}: {
  itemKey: string;
  href: string;
  pathname: string;
  departmentId: string;
  workspaceId?: string | null;
}) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (isCrossRouteActive(itemKey, pathname, departmentId, workspaceId)) return true;
  return itemKey === "assessments" && isAssessmentWorkspacePath(pathname, departmentId, workspaceId);
}

// Tooltip that appears to the right of the icon in collapsed mode
function NavTooltip({ label, enabled, children }: { label: string; enabled: boolean; children: React.ReactNode }) {
  return (
    <div className="group/tip relative">
      {children}
      {enabled && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-[200] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--app-heading)] opacity-0 shadow-xl transition-opacity duration-100 group-hover/tip:opacity-100"
        >
          {label}
        </div>
      )}
    </div>
  );
}

const itemBase = cn(
  "group flex items-center rounded-[14px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
);
const itemActive = "border-[color:var(--app-rail-item-active-border)] bg-[color:var(--app-rail-item-active-bg)] text-[color:var(--app-rail-item-active-text)]";
const itemInactive = "border-transparent text-[color:var(--app-rail-item-text)] hover:border-[color:var(--app-rail-item-hover-border)] hover:bg-[color:var(--app-rail-item-hover-bg)] hover:text-[color:var(--app-rail-item-hover-text)]";

// Level 2 inside Settings — slightly smaller padding, same active styles
const settingsItemBase = cn(
  "group flex items-center rounded-[12px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
);

export function WorkspaceSubnav({
  departmentId,
  collapsed,
  departmentName
}: {
  departmentId?: string;
  collapsed: boolean;
  departmentName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const candidatesBaseHref = departmentId ? `/departments/${departmentId}/candidates` : "";
  const isOnCandidatesPath = departmentId ? pathname.startsWith(candidatesBaseHref) : false;
  const currentStage = searchParams?.get("stage");
  const workspaceId = searchParams?.get("workspaceId");

  // Settings-zone path detection
  const isOnTeamPath = departmentId
    ? pathname === `/departments/${departmentId}/users` ||
      pathname === `/departments/${departmentId}/hiring-templates` ||
      pathname.startsWith(`/departments/${departmentId}/offer-approval-chain`)
    : false;

  const isOnAccessPath = departmentId
    ? pathname.startsWith(`/departments/${departmentId}/access`)
    : false;

  const isOnSettingsPath = isOnTeamPath || isOnAccessPath ||
    (departmentId ? pathname === `/departments/${departmentId}/designations` : false);

  // Accordion states
  const [candidatesExpanded, setCandidatesExpanded] = useState(isOnCandidatesPath);
  const [settingsExpanded, setSettingsExpanded] = useState(isOnSettingsPath);
  const [teamExpanded, setTeamExpanded] = useState(isOnTeamPath);
  const [accessExpanded, setAccessExpanded] = useState(isOnAccessPath);

  // Pending approvals badge count — self-fetched
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isOnCandidatesPath) setCandidatesExpanded(true);
  }, [isOnCandidatesPath]);

  useEffect(() => {
    if (isOnSettingsPath) setSettingsExpanded(true);
  }, [isOnSettingsPath]);

  useEffect(() => {
    if (isOnTeamPath) setTeamExpanded(true);
  }, [isOnTeamPath]);

  useEffect(() => {
    if (isOnAccessPath) setAccessExpanded(true);
  }, [isOnAccessPath]);

  useEffect(() => {
    if (!departmentId) return;
    fetch(`/api/departments/${departmentId}/pending-approvals/count`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.count) setPendingCount(data.count); })
      .catch(() => {});
  }, [departmentId]);

  if (!departmentId) return null;

  return (
    <nav className="space-y-0.5">
      {/* Section label — only in expanded mode */}
      {!collapsed && (
        <p className="px-3 pb-2 pt-0.5 text-[10px] uppercase tracking-[0.22em] font-semibold text-[color:var(--app-rail-section-text)]">
          {departmentName ?? "Workspace"}
        </p>
      )}

      {/* ── Workflow items ─────────────────────────────────────── */}
      {WORKFLOW_ITEMS.map((item) => {
        const Icon = item.icon;
        const href = item.href.replace("{id}", departmentId) as Route;
        const isExpandable = "expandable" in item && item.expandable;
        const isActive = item.key === "candidates"
          ? isOnCandidatesPath
          : isWorkspaceSubnavItemActive({ itemKey: item.key, href, pathname, departmentId, workspaceId });

        // Candidates accordion
        if (item.key === "candidates" && isExpandable && !collapsed) {
          return (
            <div key={item.key}>
              <div className={cn(itemBase, isActive ? itemActive : itemInactive)}>
                <Link href={href} className="flex flex-1 items-center gap-2.5 px-3 py-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setCandidatesExpanded((v) => !v)}
                  aria-label={candidatesExpanded ? "Collapse stages" : "Expand stages"}
                  className="flex items-center px-2.5 py-2.5"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      candidatesExpanded ? "rotate-0" : "-rotate-90",
                      isActive ? "opacity-70" : "opacity-40"
                    )}
                  />
                </button>
              </div>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out",
                  candidatesExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="mt-0.5 ml-3.5 space-y-0.5 border-l border-[color:var(--app-rail-divider)] pl-3">
                  {CANDIDATE_STAGES.map((stage) => {
                    const stageHref = `${candidatesBaseHref}?stage=${stage.stage}` as Route;
                    const isStageActive = isOnCandidatesPath && currentStage === stage.stage;
                    return (
                      <Link
                        key={stage.key}
                        href={stageHref}
                        className={cn(
                          "flex items-center gap-2 rounded-[10px] px-2.5 py-[5px] text-[13px] font-medium transition-all duration-150",
                          isStageActive
                            ? "bg-[color:var(--app-rail-item-active-bg)] text-[color:var(--app-rail-item-active-text)]"
                            : "text-[color:var(--app-rail-item-text)] opacity-70 hover:opacity-100 hover:bg-[color:var(--app-rail-item-hover-bg)] hover:text-[color:var(--app-rail-item-hover-text)]"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 transition-colors", isStageActive ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-rail-stage-dot)]")} />
                        {stage.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        // Regular workflow item or collapsed expandable
        return (
          <NavTooltip key={item.key} label={item.label} enabled={collapsed}>
            <Link
              href={href}
              className={cn(
                itemBase,
                collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2.5",
                isActive ? itemActive : itemInactive
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          </NavTooltip>
        );
      })}

      {/* ── Settings divider ───────────────────────────────────── */}
      {!collapsed && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setSettingsExpanded((v) => !v)}
            className="flex w-full items-center gap-1.5 px-3 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.22em] font-semibold text-[color:var(--app-rail-section-text)] hover:text-[color:var(--app-rail-item-text)] transition-colors"
          >
            <Settings className="h-3 w-3 shrink-0" />
            <span className="flex-1 text-left">Settings</span>
            <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-200", settingsExpanded ? "rotate-0" : "-rotate-90")} />
          </button>
        </div>
      )}

      {collapsed && <div className="my-1.5 mx-2 border-t border-[color:var(--app-rail-divider)]" />}

      {/* ── Settings items ─────────────────────────────────────── */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          !collapsed && (settingsExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0")
        )}
      >
        <div className={cn("space-y-0.5", !collapsed && "ml-1")}>
          {SETTINGS_ITEMS.map((item) => {
            const Icon = item.icon;
            const href = item.href.replace("{id}", departmentId) as Route;
            const hasSubs = item.subitems !== null && item.subitems.length > 0;

            // Determine active state
            let isActive: boolean;
            if (item.key === "team") isActive = isOnTeamPath;
            else if (item.key === "access") isActive = isOnAccessPath;
            else isActive = isWorkspaceSubnavItemActive({ itemKey: item.key, href, pathname, departmentId, workspaceId });

            // Collapsed: just icon with tooltip
            if (collapsed) {
              return (
                <NavTooltip key={item.key} label={item.label} enabled>
                  <Link
                    href={href}
                    className={cn(settingsItemBase, "justify-center p-2.5", isActive ? itemActive : itemInactive)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                  </Link>
                </NavTooltip>
              );
            }

            // No subitems (Roles)
            if (!hasSubs) {
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={cn(settingsItemBase, "gap-2 px-3 py-2", isActive ? itemActive : itemInactive)}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[13px] font-medium">{item.label}</span>
                </Link>
              );
            }

            // Expandable with subitems (Team, Access)
            const isExpanded = item.key === "team" ? teamExpanded : accessExpanded;
            const setExpanded = item.key === "team" ? setTeamExpanded : setAccessExpanded;

            return (
              <div key={item.key}>
                <div className={cn(settingsItemBase, isActive ? itemActive : itemInactive)}>
                  <Link href={href} className="flex flex-1 items-center gap-2 px-3 py-2">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-[13px] font-medium">{item.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                    className="flex items-center px-2.5 py-2"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform duration-200",
                        isExpanded ? "rotate-0" : "-rotate-90",
                        isActive ? "opacity-70" : "opacity-40"
                      )}
                    />
                  </button>
                </div>

                {/* Level 3: sub-items */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200 ease-out",
                    isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="mt-0.5 ml-3 space-y-0.5 border-l border-[color:var(--app-rail-divider)] pl-3">
                    {item.subitems.map((sub) => {
                      const subHref = sub.href.replace("{id}", departmentId) as Route;
                      const exact = "exact" in sub && sub.exact;
                      const isSubActive = exact
                        ? pathname === subHref
                        : pathname === subHref || pathname.startsWith(`${subHref}/`);
                      const showBadge = "badge" in sub && sub.badge && pendingCount > 0;

                      return (
                        <Link
                          key={sub.key}
                          href={subHref}
                          className={cn(
                            "flex items-center gap-2 rounded-[10px] px-2.5 py-[5px] text-[12px] font-medium transition-all duration-150",
                            isSubActive
                              ? "bg-[color:var(--app-rail-item-active-bg)] text-[color:var(--app-rail-item-active-text)]"
                              : "text-[color:var(--app-rail-item-text)] opacity-70 hover:opacity-100 hover:bg-[color:var(--app-rail-item-hover-bg)] hover:text-[color:var(--app-rail-item-hover-text)]"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 transition-colors", isSubActive ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-rail-stage-dot)]")} />
                          <span className="flex-1">{sub.label}</span>
                          {showBadge ? (
                            <span className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold leading-none text-black">
                              {pendingCount > 9 ? "9+" : pendingCount}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
