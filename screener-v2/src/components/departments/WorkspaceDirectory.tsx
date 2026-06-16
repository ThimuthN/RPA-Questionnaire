"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Briefcase, Search, Users2, UserCog } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { DepartmentModal } from "@/components/departments/DepartmentModal";

export type WorkspaceRow = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  jobs: number;
  candidates: number;
  members: number;
};

type StatusFilter = "all" | "active" | "inactive";

function MetricChip({ icon: Icon, value, label }: { icon: typeof Briefcase; value: number; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--app-surface-soft)] px-2.5 py-1 text-xs text-[color:var(--app-text)]"
      title={`${value} ${label}`}
    >
      <Icon className="h-3.5 w-3.5 text-[color:var(--app-muted)]" />
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-[color:var(--app-muted)]">{label}</span>
    </span>
  );
}

export function WorkspaceDirectory({ workspaces }: { workspaces: WorkspaceRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const counts = useMemo(
    () => ({
      all: workspaces.length,
      active: workspaces.filter((w) => w.isActive).length,
      inactive: workspaces.filter((w) => !w.isActive).length
    }),
    [workspaces]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspaces.filter((w) => {
      if (status === "active" && !w.isActive) return false;
      if (status === "inactive" && w.isActive) return false;
      if (q && !w.name.toLowerCase().includes(q) && !w.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [workspaces, query, status]);

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "inactive", label: "Inactive", count: counts.inactive }
  ];

  return (
    <div className="space-y-4">
      {/* Search + status filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--app-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces…"
            className="w-full rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] py-2 pl-10 pr-4 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-brand)]"
          />
        </label>
        <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatus(tab.key)}
              className={
                status === tab.key
                  ? "rounded-full bg-[color:var(--app-brand)] px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-full px-3 py-1.5 text-xs font-medium text-[color:var(--app-muted)] transition hover:text-[color:var(--app-heading)]"
              }
            >
              {tab.label} <span className="tabular-nums opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Directory */}
      <div className="overflow-hidden rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-[color:var(--app-muted)]">
            {workspaces.length === 0 ? "No workspaces yet." : "No workspaces match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--app-border)]">
            {filtered.map((w) => (
              <li key={w.id} className="flex flex-col gap-3 p-4 transition hover:bg-[color:var(--app-table-row-hover)] lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/departments/${w.id}` as Route}
                      className="truncate font-semibold text-[color:var(--app-heading)] hover:text-[color:var(--app-brand)] hover:underline"
                    >
                      {w.name}
                    </Link>
                    <StatusPill label={w.isActive ? "Active" : "Inactive"} tone={w.isActive ? "emerald" : "neutral"} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <MetricChip icon={Briefcase} value={w.jobs} label="jobs" />
                    <MetricChip icon={Users2} value={w.candidates} label="candidates" />
                    <MetricChip icon={UserCog} value={w.members} label="team" />
                  </div>
                </div>

                <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                  <Link href={`/departments/${w.id}` as Route}>
                    <Button variant="secondary" className="px-3 py-2 text-xs">Open</Button>
                  </Link>
                  <Link href={`/departments/${w.id}/users` as Route}>
                    <Button variant="ghost" className="px-3 py-2 text-xs">Manage team</Button>
                  </Link>
                  <DepartmentModal mode="edit" department={{ id: w.id, slug: w.slug, name: w.name, isActive: w.isActive, sortOrder: w.sortOrder }} />
                  <form action={`/api/departments/${w.id}`} method="post" className="inline">
                    <input type="hidden" name="action" value={w.isActive ? "deactivate" : "activate"} />
                    <Button type="submit" variant="ghost" className="px-3 py-2 text-xs">
                      {w.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
