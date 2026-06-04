"use client";

import { createPortal } from "react-dom";
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
    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--app-brand)]/20 bg-[color:var(--app-brand)]/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--app-brand)]">
      <Check className="h-3 w-3" />
      Current
    </span>
  );
}

function workspaceOptionClassName(isActive: boolean) {
  return cn(
    "flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-sm transition",
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
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // cardRef wraps the entire workspace card — used for position calculation and click-outside.
  const cardRef = useRef<HTMLDivElement>(null);
  // panelRef is the portaled dropdown panel — used for click-outside.
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (cardRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setFilter("");
  }, [isOpen]);

  function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      // Panel left-aligns with the workspace card; width is w-80 (320px).
      // Clamp so it never starts less than 8px from the viewport left edge.
      setPanelPos({ top: r.bottom + 6, left: Math.max(8, r.left) });
    }
    setIsOpen(true);
  }

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

  const panelContent = (
    <div
      ref={panelRef}
      style={{ top: panelPos.top, left: panelPos.left }}
      className={cn(
        "fixed z-50 w-80 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[0_24px_56px_rgba(3,8,20,0.45)] ring-1 ring-black/5 transition duration-150",
        isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
      )}
    >
      <div className="rounded-t-[18px] border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
          Switch workspace
        </p>
        {showSearch ? (
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter departments"
            className="mt-2 w-full rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] outline-none transition focus:border-[color:var(--app-brand)]/50"
          />
        ) : null}
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {adminOption ? (
          <div className="space-y-0.5 pb-2">
            <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
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
          <div className="space-y-0.5">
            <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
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
  );

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
        ref={cardRef}
        className={cn(
          "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] transition-all",
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
              <>
                <button
                  type="button"
                  onClick={handleToggle}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-full border p-1.5 transition",
                    isOpen
                      ? "border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-[color:var(--app-heading)]"
                      : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-muted)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-control-bg)]"
                  )}
                  aria-label="Toggle workspace menu"
                  aria-expanded={isOpen}
                >
                  <ChevronDown className={cn("h-4 w-4 transition duration-200", isOpen && "rotate-180")} />
                </button>

                {mounted ? createPortal(panelContent, document.body) : null}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
