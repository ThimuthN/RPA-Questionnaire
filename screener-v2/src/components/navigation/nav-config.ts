import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { Activity, Blocks, BriefcaseBusiness, Building, Building2, ClipboardList, RadioTower, UserCog, Users2 } from "lucide-react";
import { copy } from "@/lib/design/copy";
import type { AppSession } from "@/lib/auth/session";

export type NavItem = { href: Route; label: string; icon: LucideIcon };

export function getNavItems(viewer: Pick<AppSession, "permissions" | "departmentId"> | null): NavItem[] {
  return viewer
    ? [
        { href: "/people/candidates" as Route, label: copy.nav.candidates, icon: Users2 },
        { href: "/addons" as Route, label: copy.nav.addons, icon: Blocks },
        { href: "/assessments" as Route, label: copy.nav.create, icon: ClipboardList },
        { href: "/results" as Route, label: copy.nav.results, icon: Activity },
        { href: "/live" as Route, label: copy.nav.run, icon: RadioTower },
        { href: "/jobs" as Route, label: "Careers", icon: BriefcaseBusiness },
        ...(viewer.permissions.includes("manage_users")
          ? [
              { href: "/users" as Route, label: copy.nav.users, icon: UserCog },
              { href: "/departments" as Route, label: "Departments", icon: Building2 }
            ]
          : []),
        ...(viewer.departmentId
          ? [
              { href: `/departments/${viewer.departmentId}` as Route, label: "My Department", icon: Building }
            ]
          : [])
      ]
    : [
        { href: "/jobs" as Route, label: "Careers", icon: BriefcaseBusiness },
        { href: "/live" as Route, label: copy.nav.run, icon: RadioTower }
      ];
}

export function isNavItemActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/jobs" && pathname.startsWith("/jobs")) ||
    (href === "/results" && pathname.startsWith("/results/")) ||
    (href === "/people/candidates" && (pathname.startsWith("/people") || pathname.startsWith("/candidates"))) ||
    (href === "/addons" && pathname.startsWith("/addons")) ||
    (href === "/assessments" && (pathname.startsWith("/assessments") || pathname.startsWith("/create-test"))) ||
    (href === "/live" && (pathname.startsWith("/live") || pathname.startsWith("/run-test"))) ||
    (href === "/users" && pathname.startsWith("/users")) ||
    (href.startsWith("/departments/") && pathname.startsWith("/departments/")) ||
    (href === "/departments" && pathname === "/departments")
  );
}
