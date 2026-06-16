"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { Button } from "@/components/primitives/Button";
import { UserAvatarInitials } from "@/components/users/UserAvatarInitials";
import { GrantAccessModal } from "@/components/admin/GrantAccessModal";

type AccessGrantLite = {
  scope: string;
  role: { slug: string; label: string } | null;
  department: { name: string } | null;
};

export type DirectoryUser = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  accessGrants: AccessGrantLite[];
};

// Derive these from GrantAccessModal so they always stay in sync with what the modal expects.
type GrantProps = React.ComponentProps<typeof GrantAccessModal>;
type Department = GrantProps["departments"][number];
type Role = GrantProps["systemRoles"][number];

type StatusFilter = "all" | "active" | "inactive";

function isSystemAdminGrants(grants: AccessGrantLite[]) {
  return grants.some((g) => g.scope === "system");
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diff) || diff < 0) return "—";
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function AccessBadges({ grants }: { grants: AccessGrantLite[] }) {
  if (grants.length === 0) {
    return <span className="text-xs text-[color:var(--app-muted)]">No access</span>;
  }

  const sysAdmin = isSystemAdminGrants(grants);
  const deptGrants = grants.filter((g) => g.scope === "department");
  const shown = deptGrants.slice(0, 2);
  const extra = deptGrants.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sysAdmin ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--pill-purple-border)] bg-[color:var(--pill-purple-bg)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--pill-purple-text)]">
          <ShieldCheck className="h-3 w-3" />
          System admin
        </span>
      ) : null}
      {shown.map((g, i) => (
        <span
          key={i}
          className="inline-flex max-w-[180px] items-center truncate rounded-full bg-[color:var(--app-surface-soft)] px-2 py-0.5 text-[11px] text-[color:var(--app-text)]"
          title={`${g.department?.name ?? "Department"}${g.role?.label ? ` · ${g.role.label}` : ""}`}
        >
          {g.department?.name ?? "Department"}{g.role?.label ? ` · ${g.role.label}` : ""}
        </span>
      ))}
      {extra > 0 ? <span className="text-[11px] text-[color:var(--app-muted)]">+{extra} more</span> : null}
      {!sysAdmin && deptGrants.length === 0 ? (
        <span className="text-xs text-[color:var(--app-muted)]">No active roles</span>
      ) : null}
    </div>
  );
}

export function UserDirectory({
  users,
  departments,
  systemRoles,
  currentUserId
}: {
  users: DirectoryUser[];
  departments: Department[];
  systemRoles: Role[];
  currentUserId?: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (status === "active" && !u.isActive) return false;
      if (status === "inactive" && u.isActive) return false;
      if (q && !(u.name ?? "").toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, query, status]);

  async function setActive(userId: string, action: "deactivate" | "reactivate") {
    if (action === "deactivate" && !confirm("Deactivate this user? They will lose access immediately.")) return;
    setBusyId(userId);
    setError("");
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.message || "Could not update user.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user.");
    } finally {
      setBusyId(null);
    }
  }

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "inactive", label: "Inactive", count: counts.inactive }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--app-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or email…"
            className="w-full rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] py-2.5 pl-10 pr-4 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-brand)]"
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

      {error ? (
        <p className="rounded-[14px] border border-[color:var(--app-danger-soft)] bg-[color:var(--app-danger-soft)] px-4 py-2.5 text-sm text-[color:var(--app-danger)]">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-[color:var(--app-muted)]">
            {users.length === 0 ? "No users yet — create your first user to get started." : "No users match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--app-border)]">
            {filtered.map((user) => {
              const isSelf = currentUserId === user.id;
              return (
                <li key={user.id} className="flex flex-col gap-3 p-4 transition hover:bg-[color:var(--app-table-row-hover)] lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatarInitials name={user.name} email={user.email} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-[color:var(--app-heading)]">{user.name || "Unnamed"}</span>
                        <StatusPill label={user.isActive ? "Active" : "Inactive"} tone={user.isActive ? "emerald" : "neutral"} />
                        {isSelf ? <span className="text-[10px] uppercase tracking-wide text-[color:var(--app-muted)]">You</span> : null}
                      </div>
                      <p className="truncate text-xs text-[color:var(--app-muted)]">{user.email}</p>
                      <div className="mt-1.5"><AccessBadges grants={user.accessGrants} /></div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                    <span className="text-xs text-[color:var(--app-muted)]" title="Last sign-in">
                      Last active <span className="text-[color:var(--app-text)]">{relativeTime(user.lastLoginAt)}</span>
                    </span>
                    <GrantAccessModal
                      userId={user.id}
                      userName={user.name || user.email}
                      departments={departments.filter((d) => d.slug !== "system")}
                      systemRoles={systemRoles}
                    />
                    {user.isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 py-2 text-xs"
                        disabled={busyId === user.id || isSelf}
                        title={isSelf ? "You cannot deactivate your own account" : undefined}
                        onClick={() => void setActive(user.id, "deactivate")}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        disabled={busyId === user.id}
                        onClick={() => void setActive(user.id, "reactivate")}
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
