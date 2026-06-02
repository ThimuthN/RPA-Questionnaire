import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, Building2, ClipboardList, Users2 } from "lucide-react";
import { copy } from "@/lib/design/copy";
import type { AppSession } from "@/lib/auth/session";

export type NavItem = { href: Route; label: string; icon: LucideIcon };

export function getNavItems(viewer: Pick<AppSession, "permissions" | "departmentId"> | null): NavItem[] {
  if (!viewer) {
    return [{ href: "/jobs" as Route, label: "Careers", icon: BriefcaseBusiness }];
  }

  const workspaceItem = viewer.permissions.includes("manage_users")
    ? [{ href: "/departments" as Route, label: "Departments", icon: Building2 }]
    : viewer.departmentId
      ? [{ href: `/departments/${viewer.departmentId}` as Route, label: "Workspace", icon: Building2 }]
      : [];

  return [
    ...workspaceItem,
    { href: "/people/candidates/jobs" as Route, label: "Jobs", icon: BriefcaseBusiness },
    { href: "/people/candidates/applicants" as Route, label: "Applicants", icon: ClipboardList },
    { href: "/people/candidates" as Route, label: copy.nav.candidates, icon: Users2 },
    { href: "/assessments" as Route, label: copy.nav.create, icon: ClipboardList }
  ];
}

export function isNavItemActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/jobs" && pathname === "/jobs") ||
    (href === "/people/candidates/jobs" && pathname.startsWith("/people/candidates/jobs")) ||
    (href === "/people/candidates/applicants" && pathname.startsWith("/people/candidates/applicants")) ||
    (href === "/people/candidates" && pathname === "/people/candidates") ||
    (href === "/assessments" && (pathname.startsWith("/assessments") || pathname.startsWith("/create-test"))) ||
    ((href === "/departments" || href.startsWith("/departments/")) &&
      (pathname === href || pathname.startsWith(`${href}/`)))
  );
}
