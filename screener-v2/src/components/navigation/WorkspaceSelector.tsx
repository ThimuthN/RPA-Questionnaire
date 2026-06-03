"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Department = {
  id: string;
  name: string;
  isActive: boolean;
};

export function WorkspaceSelector({
  currentDepartmentId,
  departments,
  collapsed
}: {
  currentDepartmentId?: string | null;
  departments: Department[];
  collapsed: boolean;
}) {
  const activeDept = departments.find((d) => d.id === currentDepartmentId);
  const activeDepts = departments.filter((d) => d.isActive);

  // If no department context, don't render selector
  if (!currentDepartmentId || !activeDept) {
    return null;
  }

  return (
    <div className="space-y-2 px-2 py-3">
      <p className={cn(
        "text-[11px] uppercase tracking-[0.2em] text-[color:var(--app-muted)] font-semibold px-2",
        collapsed && "hidden"
      )}>
        Current workspace
      </p>
      <div className={cn(
        "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] transition-all",
        collapsed ? "p-2 flex items-center justify-center" : "px-3 py-2"
      )}>
        {collapsed ? (
          <Link
            href={`/departments/${currentDepartmentId}`}
            title={activeDept.name}
            className="text-xs font-semibold text-[color:var(--app-heading)] truncate"
          >
            {activeDept.name.substring(0, 2).toUpperCase()}
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/departments/${currentDepartmentId}`}
              className="text-sm font-medium text-[color:var(--app-heading)] hover:text-[color:var(--app-brand)] transition truncate flex-1"
            >
              {activeDept.name}
            </Link>
            {activeDepts.length > 1 && (
              <details className="group">
                <summary className="list-none cursor-pointer p-1 hover:bg-[color:var(--app-surface)] rounded transition">
                  <ChevronDown className="h-4 w-4 text-[color:var(--app-muted)] group-open:rotate-180 transition" />
                </summary>
                <div className="absolute left-2 right-2 mt-1 z-50 rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-lg max-h-64 overflow-y-auto">
                  {activeDepts.map((dept) => (
                    <Link
                      key={dept.id}
                      href={`/departments/${dept.id}`}
                      className={cn(
                        "block px-3 py-2 text-sm transition",
                        currentDepartmentId === dept.id
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
