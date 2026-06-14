import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, Building2, ClipboardList, PlugZap, Shield, Users, Users2 } from "lucide-react";
import { copy } from "@/lib/design/copy";
import type { AppSession } from "@/lib/auth/session";

export type NavItem = { href: Route; label: string; icon: LucideIcon; section?: string };

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
    return [{ href: "/jobs" as Route, label: "Careers", icon: BriefcaseBusiness }];
  }

  const canManageUsers = viewer.permissions.includes("manage_users");
  const canManageIntegrations = viewer.permissions.includes("manage_integrations");
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
        { href: "/departments" as Route, label: "Manage Workspaces", icon: Building2, section: "Admin" },
        { href: "/users" as Route, label: "User Management", icon: Users, section: "Admin" },
        { href: "/access-roles" as Route, label: "Access Roles", icon: Shield, section: "Admin" }
      );
    }

    if (canManageIntegrations) {
      items.push({ href: "/integrations" as Route, label: "App Integrations", icon: PlugZap, section: "Admin" });
    }

    if (canManageUsers) {
      items.push(
        { href: "/people/candidates/jobs" as Route, label: "All Jobs", icon: BriefcaseBusiness, section: "All hiring" },
        { href: "/people/candidates/applicants" as Route, label: "All Applicants", icon: ClipboardList },
        { href: "/people/candidates" as Route, label: `All ${copy.nav.candidates}`, icon: Users2 },
        { href: "/assessments" as Route, label: copy.nav.create, icon: ClipboardList }
      );
    }

    return items;
  }

  // Default fallback (no workspace selected yet): show minimal items
  return [];
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
    (href === "/assessments" &&
      (pathname.startsWith("/assessments") ||
        pathname.startsWith("/create-test") ||
        pathname.startsWith("/addons") ||
        pathname.startsWith("/results"))) ||
    (href === "/departments" && pathname === "/departments")
  );
}
