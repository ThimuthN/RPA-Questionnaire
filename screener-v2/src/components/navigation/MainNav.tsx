"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileNavDrawer } from "@/components/navigation/MobileNavDrawer";
import { getNavItems } from "@/components/navigation/nav-config";
import { resolveCurrentWorkspace } from "@/components/navigation/WorkspaceRail";
import type { Department } from "@/components/navigation/WorkspaceSelector";
import type { AppSession } from "@/lib/auth/session";

export function MainNav({
  viewer,
  departments = []
}: {
  viewer: Pick<AppSession, "email" | "name" | "permissions" | "departmentId"> | null;
  departments?: Department[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = viewer?.permissions.includes("manage_users") ?? false;
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

  const currentDept = currentWorkspace && currentWorkspace !== "admin"
    ? visibleDepartments.find((d) => d.id === currentWorkspace)
    : undefined;

  const items = getNavItems(viewer, currentWorkspace);

  return (
    <div className="flex items-center gap-2 md:hidden">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] px-3 py-2 text-sm text-[color:var(--app-scene-heading)] transition hover:bg-[color:var(--app-header-surface-hover)]"
      >
        <Menu className="h-4 w-4" />
        <span>{viewer ? "Menu" : "Explore"}</span>
      </button>

      <MobileNavDrawer
        open={mobileOpen}
        items={items}
        pathname={pathname}
        viewer={viewer}
        departmentId={currentDept?.id}
        departmentName={currentDept?.name}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}
