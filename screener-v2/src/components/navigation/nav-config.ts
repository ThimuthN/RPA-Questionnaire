import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BriefcaseBusiness, Building2, ClipboardList, Home, Lock, PlugZap, ScrollText, Shield, Users, Users2 } from "lucide-react";
import { copy } from "@/lib/design/copy";
import type { AppSession } from "@/lib/auth/session";

export type NavSubItem = { href: Route; label: string; stage: string };
export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  section?: string;
  /** Optional pipeline-stage sub-items rendered as an accordion under this item (mirrors the department workspace candidates sub-nav). */
  children?: NavSubItem[];
};

/** Global candidate pipeline stages — mirrors the department workspace CANDIDATE_STAGES. */
export const GLOBAL_CANDIDATE_STAGES: NavSubItem[] = [
  { href: "/people/candidates?stage=pipeline" as Route, label: "Pipeline", stage: "pipeline" },
  { href: "/people/candidates?stage=screening" as Route, label: "Screening", stage: "screening" },
  { href: "/people/candidates?stage=interview" as Route, label: "Interview", stage: "interview" },
  { href: "/people/candidates?stage=advanced_review" as Route, label: "Review", stage: "advanced_review" },
  { href: "/people/candidates?stage=finalized" as Route, label: "Final", stage: "finalized" }
];

/**
 * Get navigation items for the sidebar.
 *
 * WorkspaceSubnav is the sole source of truth for department workspace items.
 * This function only returns items for admin workspace context.
 *
 * @param viewer - The current user session
 * @param workspace - The currently selected workspace ('admin' or a department ID)
 * @returns Navigation items for the selected workspace (admin workspace only)
 */
export function getNavItems(
  viewer: Pick<AppSession, "permissions" | "departmentId"> | null,
  workspace?: string | null
): NavItem[] {
  if (!viewer) {
    return [];
  }

  const canManageUsers = viewer.permissions.includes("manage_users");
  const canManageIntegrations =
    viewer.permissions.includes("manage_integrations") || viewer.permissions.includes("manage_users");
  const isAdminWorkspace = workspace === "admin";

  // Department workspace: WorkspaceSubnav handles all navigation
  // This function returns nothing for department workspaces to avoid duplication
  if (!isAdminWorkspace && workspace && workspace !== "admin") {
    return [];
  }

  // Admin workspace: show admin/global items
  if (isAdminWorkspace && (canManageUsers || canManageIntegrations)) {
    const items: NavItem[] = [];

    if (canManageUsers) {
      items.push(
        { href: "/departments" as Route, label: "Workspaces", icon: Building2, section: "Admin" },
        { href: "/users" as Route, label: "Users", icon: Users, section: "Admin" },
        { href: "/access-roles" as Route, label: "Access Roles", icon: Shield, section: "Admin" },
        { href: "/security" as Route, label: "Security", icon: Lock, section: "Admin" },
        { href: "/audit-log" as Route, label: "Audit Log", icon: ScrollText, section: "Admin" }
      );
    }

    if (canManageIntegrations) {
      items.push({ href: "/integrations" as Route, label: "Integrations", icon: PlugZap, section: "Admin" });
    }

    if (canManageUsers) {
      items.push(
        { href: "/people/candidates/jobs" as Route, label: "All Jobs", icon: BriefcaseBusiness, section: "All hiring" },
        { href: "/people/candidates/applicants" as Route, label: "All Applicants", icon: ClipboardList },
        { href: "/people/candidates" as Route, label: `All ${copy.nav.candidates}`, icon: Users2, children: GLOBAL_CANDIDATE_STAGES },
        { href: "/people/analytics" as Route, label: "Analytics", icon: BarChart3 },
        { href: "/assessments" as Route, label: copy.nav.create, icon: ClipboardList }
      );
    }

    return items;
  }

  // Default fallback: authenticated user on a non-workspace page (marketing, careers, etc.)
  // Show a home link so they can navigate back to the app
  return [{ href: "/departments" as Route, label: "Home", icon: Home }];
}

export function isNavItemActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/jobs" && pathname === "/jobs") ||
    (href === "/users" && pathname === "/users") ||
    (href === "/access-roles" && pathname === "/access-roles") ||
    (href === "/integrations" && pathname.startsWith("/integrations")) ||
    (href === "/people/candidates/jobs" && pathname.startsWith("/people/candidates/jobs")) ||
    (href === "/people/candidates/applicants" && pathname.startsWith("/people/candidates/applicants")) ||
    (href === "/people/candidates" && pathname === "/people/candidates") ||
    (href === "/people/analytics" && pathname.startsWith("/people/analytics")) ||
    (href === "/assessments" &&
      (pathname.startsWith("/assessments") ||
        pathname.startsWith("/create-test") ||
        pathname.startsWith("/addons") ||
        pathname.startsWith("/results"))) ||
    (href === "/departments" && pathname === "/departments") ||
    (href === "/security" && pathname.startsWith("/security")) ||
    (href === "/audit-log" && pathname.startsWith("/audit-log"))
  );
}
