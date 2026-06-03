"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Home,
  BriefcaseBusiness,
  ClipboardList,
  Users2,
  Users,
  Lock,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const WORKSPACE_SUBITEMS = [
  { key: "overview", label: "Overview", icon: Home, href: "/departments/{id}" },
  { key: "jobs", label: "Jobs", icon: BriefcaseBusiness, href: "/departments/{id}/jobs" },
  { key: "applicants", label: "Applicants", icon: ClipboardList, href: "/departments/{id}/applicants" },
  { key: "candidates", label: "Candidates", icon: Users2, href: "/departments/{id}/candidates" },
  { key: "assessments", label: "Assessments", icon: LogOut, href: "/departments/{id}/assessments" },
  { key: "team", label: "Team", icon: Users, href: "/departments/{id}/users" },
  { key: "access", label: "Access", icon: Lock, href: "/departments/{id}/access" },
  { key: "designations", label: "Job Designations", icon: BriefcaseBusiness, href: "/departments/{id}/designations" }
];

export function WorkspaceSubnav({
  departmentId,
  collapsed
}: {
  departmentId?: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();

  if (!departmentId) {
    return null;
  }

  return (
    <nav className="space-y-1">
      {WORKSPACE_SUBITEMS.map((item) => {
        const Icon = item.icon;
        const href = item.href.replace("{id}", departmentId) as Route;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={item.key}
            href={href}
            className={cn(
              "group flex items-center rounded-[20px] border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
              collapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
              isActive
                ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_70%,white))] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]"
                : "border-transparent text-[color:var(--app-scene-text)] hover:border-white/18 hover:bg-white/10 hover:text-white"
            )}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={cn("text-sm font-medium transition-all duration-300", collapsed ? "hidden" : "block")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
