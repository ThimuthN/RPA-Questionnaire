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

export const WORKSPACE_SUBITEMS = [
  { key: "overview", label: "Overview", icon: Home, href: "/departments/{id}" },
  { key: "jobs", label: "Jobs", icon: Briefcase, href: "/departments/{id}/jobs" },
  { key: "applicants", label: "Applicants", icon: ClipboardList, href: "/departments/{id}/applicants" },
  { key: "candidates", label: "Candidates", icon: Users2, href: "/departments/{id}/candidates", expandable: true as const },
  { key: "assessments", label: "Assessments", icon: FileCheck, href: "/departments/{id}/assessments" },
  { key: "team", label: "Team", icon: Users, href: "/departments/{id}/users" },
  { key: "access", label: "Access", icon: Lock, href: "/departments/{id}/access" },
  { key: "designations", label: "Roles", icon: Tag, href: "/departments/{id}/designations" }
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
const itemActive = "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]";
const itemInactive = "border-transparent text-[color:var(--app-scene-text)] hover:border-white/12 hover:bg-white/8 hover:text-white";

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

  const [candidatesExpanded, setCandidatesExpanded] = useState(isOnCandidatesPath);

  useEffect(() => {
    if (isOnCandidatesPath) setCandidatesExpanded(true);
  }, [isOnCandidatesPath]);

  if (!departmentId) return null;

  return (
    <nav className="space-y-0.5">
      {/* Section label — only in expanded mode */}
      {!collapsed && (
        <p className="px-3 pb-2 pt-0.5 text-[10px] uppercase tracking-[0.22em] font-semibold text-[color:var(--app-scene-text)]/50">
          {departmentName ?? "Workspace"}
        </p>
      )}

      {WORKSPACE_SUBITEMS.map((item) => {
        const Icon = item.icon;
        const href = item.href.replace("{id}", departmentId) as Route;

        const isExpandable = "expandable" in item && item.expandable;
        const isActive = isExpandable
          ? isOnCandidatesPath
          : isWorkspaceSubnavItemActive({ itemKey: item.key, href, pathname, departmentId, workspaceId });

        // Expandable Candidates item — full accordion in expanded sidebar
        if ("expandable" in item && item.expandable && !collapsed) {
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

              {/* Stage sub-items — animated accordion */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out",
                  candidatesExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="mt-0.5 ml-3.5 space-y-0.5 border-l border-white/10 pl-3">
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
                            ? "bg-white/15 text-white"
                            : "text-[color:var(--app-scene-text)]/60 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0 transition-colors",
                            isStageActive ? "bg-[color:var(--app-brand)]" : "bg-white/20"
                          )}
                        />
                        {stage.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        // Collapsed expandable or regular item — icon only with tooltip
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
    </nav>
  );
}
