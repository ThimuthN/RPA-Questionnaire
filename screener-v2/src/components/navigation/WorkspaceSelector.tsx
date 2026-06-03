"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Department = {
  id: string;
  name: string;
  isActive: boolean;
};

type WorkspaceOption = {
  href: Route;
  id: string;
  label: string;
  detail: string;
};

function activeBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--app-brand)]/20 bg-[color:var(--app-brand)]/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
      <Check className="h-3 w-3" />
      Current
    </span>
  );
}

function workspaceOptionClassName(isActive: boolean) {
  return cn(
    "flex items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-sm transition",
    isActive
      ? "bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)]"
      : "text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)]"
  );
}

export function WorkspaceSelector({
  currentWorkspace,
  departments,
  isAdmin,
  collapsed
}: {
  currentWorkspace?: string | null;
  departments: Department[];
  isAdmin: boolean;
  collapsed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (!isOpen) {
      return;
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFilter("");
    }
  }, [isOpen]);

  const activeDept = departments.find((department) => department.id === currentWorkspace);
  const activeDepts = departments.filter((department) => department.isActive);
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredDepts = normalizedFilter
    ? activeDepts.filter((department) => department.name.toLowerCase().includes(normalizedFilter))
    : activeDepts;
  const showAdminOption = isAdmin;
  const hasMultipleOptions = (showAdminOption ? 1 : 0) + activeDepts.length > 1;
  const showSearch = activeDepts.length > 8;

  let displayName = "Select workspace";
  let workspaceHref: Route = "/" as Route;
  let abbreviation = "?";
  let workspaceTypeLabel = "Department workspace";

  if (currentWorkspace === "admin" && showAdminOption) {
    displayName = "Admin Workspace";
    workspaceHref = "/departments";
    abbreviation = "AD";
    workspaceTypeLabel = "Admin";
  } else if (activeDept) {
    displayName = activeDept.name;
    workspaceHref = `/departments/${activeDept.id}` as Route;
    abbreviation = activeDept.name.substring(0, 2).toUpperCase();
  }

  if (!currentWorkspace) {
    return null;
  }

  const adminOption: WorkspaceOption | null = showAdminOption
    ? {
        id: "admin",
        href: "/departments",
        label: "Admin Workspace",
        detail: "Manage all hiring workspaces"
      }
    : null;
  const departmentOptions: WorkspaceOption[] = filteredDepts.map((department) => ({
    id: department.id,
    href: `/departments/${department.id}` as Route,
    label: department.name,
    detail: "Department workspace"
  }));

  return (
    <div className="space-y-2 px-2 py-3">
      <p
        className={cn(
          "px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]",
          collapsed && "hidden"
        )}
      >
        Workspace
      </p>
      <div
        className={cn(
          "relative rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] transition-all",
          collapsed ? "flex items-center justify-center p-2" : "px-3 py-2"
        )}
      >
        {collapsed ? (
          <Link
            href={workspaceHref}
            title={`${displayName} (${workspaceTypeLabel})`}
            className="truncate text-xs font-semibold text-[color:var(--app-heading)]"
          >
            {abbreviation}
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link href={workspaceHref} className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-sm font-semibold text-[color:var(--app-heading)] transition hover:text-[color:var(--app-brand)]">
                {displayName}
              </p>
              <p className="truncate text-xs text-[color:var(--app-muted)]">{workspaceTypeLabel}</p>
            </Link>

            {hasMultipleOptions ? (
              <div ref={dropdownRef} className="relative z-[100]">
                <button
                  type="button"
                  onClick={() => setIsOpen((current) => !current)}
                  className="cursor-pointer rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-1.5 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-control-bg)]"
                  aria-label="Toggle workspace menu"
                  aria-expanded={isOpen}
                >
                  <ChevronDown className={cn("h-4 w-4 text-[color:var(--app-muted)] transition", isOpen && "rotate-180")} />
                </button>

                <div
                  aria-hidden={!isOpen}
                  className={cn(
                    "absolute right-0 top-full mt-2 w-72 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[0_22px_48px_rgba(3,8,20,0.34)] ring-1 ring-black/5 transition duration-150",
                    isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                  )}
                >
                  <div className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                      Switch workspace
                    </p>
                    {showSearch ? (
                      <input
                        type="search"
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        placeholder="Filter departments"
                        className="mt-3 w-full rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50"
                      />
                    ) : null}
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {adminOption ? (
                      <div className="space-y-1 pb-2">
                        <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                          Admin
                        </p>
                        <Link
                          href={adminOption.href}
                          onClick={() => setIsOpen(false)}
                          aria-current={currentWorkspace === adminOption.id ? "page" : undefined}
                          className={workspaceOptionClassName(currentWorkspace === adminOption.id)}
                        >
                          <span>
                            <span className="block font-medium">{adminOption.label}</span>
                            <span className="block text-xs text-[color:var(--app-muted)]">{adminOption.detail}</span>
                          </span>
                          {currentWorkspace === adminOption.id ? activeBadge() : null}
                        </Link>
                      </div>
                    ) : null}

                    {activeDepts.length > 0 ? (
                      <div className="space-y-1">
                        <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                          Department Workspaces
                        </p>
                        {departmentOptions.length > 0 ? (
                          departmentOptions.map((department) => (
                            <Link
                              key={department.id}
                              href={department.href}
                              onClick={() => setIsOpen(false)}
                              aria-current={currentWorkspace === department.id ? "page" : undefined}
                              className={workspaceOptionClassName(currentWorkspace === department.id)}
                            >
                              <span>
                                <span className="block font-medium">{department.label}</span>
                                <span className="block text-xs text-[color:var(--app-muted)]">{department.detail}</span>
                              </span>
                              {currentWorkspace === department.id ? activeBadge() : null}
                            </Link>
                          ))
                        ) : (
                          <p className="rounded-[14px] px-3 py-3 text-sm text-[color:var(--app-muted)]">
                            No workspace matches this filter.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
