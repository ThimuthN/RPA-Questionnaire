"use client";

import type { Route } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Department = {
  id: string;
  name: string;
  isActive: boolean;
};

export function WorkspaceSelector({
  currentWorkspace,
  departments,
  isAdmin,
  collapsed
}: {
  currentWorkspace?: string | null; // 'admin' or a department ID
  departments: Department[];
  isAdmin: boolean;
  collapsed: boolean;
}) {
  const activeDept = departments.find((d) => d.id === currentWorkspace);
  const activeDepts = departments.filter((d) => d.isActive);
  const showAdminOption = isAdmin;
  const hasMultipleOptions = (showAdminOption ? 1 : 0) + activeDepts.length > 1;

  // Determine display name and href
  let displayName = "Select workspace";
  let workspaceHref = "/";
  let abbreviation = "?";

  if (currentWorkspace === "admin" && showAdminOption) {
    displayName = "Admin Workspace";
    workspaceHref = "/departments";
    abbreviation = "⚙";
  } else if (activeDept) {
    displayName = activeDept.name;
    workspaceHref = `/departments/${activeDept.id}`;
    abbreviation = activeDept.name.substring(0, 2).toUpperCase();
  }

  // Don't render if no valid workspace
  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="space-y-2 px-2 py-3">
      <p className={cn(
        "text-[11px] uppercase tracking-[0.2em] text-[color:var(--app-muted)] font-semibold px-2",
        collapsed && "hidden"
      )}>
        Workspace
      </p>
      <div className={cn(
        "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] transition-all relative",
        collapsed ? "p-2 flex items-center justify-center" : "px-3 py-2"
      )}>
        {collapsed ? (
          <Link
            href={workspaceHref as Route}
            title={displayName}
            className="text-xs font-semibold text-[color:var(--app-heading)] truncate"
          >
            {abbreviation}
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href={workspaceHref as Route}
              className="text-sm font-medium text-[color:var(--app-heading)] hover:text-[color:var(--app-brand)] transition truncate flex-1"
            >
              {displayName}
            </Link>
            {hasMultipleOptions && (
              <details className="group relative z-[100]">
                <summary className="list-none cursor-pointer p-1 hover:bg-[color:var(--app-surface)] rounded transition">
                  <ChevronDown className="h-4 w-4 text-[color:var(--app-muted)] group-open:rotate-180 transition" />
                </summary>
                <div className="absolute right-0 top-full mt-2 z-[100] w-56 rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-lg max-h-72 overflow-y-auto">
                  {showAdminOption && (
                    <Link
                      href="/departments"
                      className={cn(
                        "block px-3 py-2 text-sm transition border-b border-[color:var(--app-border)]",
                        currentWorkspace === "admin"
                          ? "bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)] font-medium"
                          : "text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
                      )}
                    >
                      Admin Workspace
                    </Link>
                  )}
                  {activeDepts.map((dept) => (
                    <Link
                      key={dept.id}
                      href={`/departments/${dept.id}`}
                      className={cn(
                        "block px-3 py-2 text-sm transition",
                        currentWorkspace === dept.id
                          ? "bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)] font-medium"
                          : "text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
                      )}
                    >
                      {dept.name}
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
