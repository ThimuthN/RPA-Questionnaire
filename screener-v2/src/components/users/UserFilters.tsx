"use client";

import { useMemo, useState } from "react";
import { FormInput } from "@/components/primitives/FormInput";
import type { AppUserRow } from "@/lib/auth/app-auth";

export function UserFilters({ users }: { users: AppUserRow[] }) {
  const [search, setSearch] = useState("");
  const [accessLevelFilter, setAccessLevelFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active">("all");

  const departments = useMemo(
    () => Array.from(new Set(users.map((u) => u.department).filter(Boolean))).sort() as string[],
    [users]
  );

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesAccessLevel = accessLevelFilter === "all" || user.accessLevel === accessLevelFilter;
      const matchesDept = departmentFilter === "all" || user.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && user.isActive);

      return matchesSearch && matchesAccessLevel && matchesDept && matchesStatus;
    });
  }, [users, search, accessLevelFilter, departmentFilter, statusFilter]);

  return (
    <div className="space-y-4 border-b border-[color:var(--app-border)] pb-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <FormInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={accessLevelFilter}
          onChange={(e) => setAccessLevelFilter(e.target.value)}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="recruiter">Recruiter</option>
          <option value="hiring_manager">Hiring Manager</option>
          <option value="interviewer">Interviewer</option>
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        >
          <option value="all">All departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active")}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        >
          <option value="all">All members</option>
          <option value="active">Active only</option>
        </select>
      </div>

      <p className="text-sm text-[color:var(--app-muted)]">
        Showing {filtered.length} of {users.length} members
      </p>
    </div>
  );
}
