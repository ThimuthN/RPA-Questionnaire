"use client";

import { useState, useTransition, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export interface AuditLogEntry {
  id: string;
  action: string;
  actorEmail: string | null;
  targetId: string;
  targetType: string;
  after: unknown;
  ipAddress: string | null;
  createdAt: string;
}

interface Props {
  initialLogs: AuditLogEntry[];
  initialTotal: number;
  initialPages: number;
}

const ACTION_LABELS: Record<string, string> = {
  user_login: "Login",
  user_login_failed: "Login failed",
  user_logout: "Logout",
  user_password_reset: "Password reset",
  user_invite_accepted: "Invite accepted",
  user_mfa_enabled: "MFA enabled",
  user_mfa_disabled: "MFA disabled",
  mfa_backup_codes_regenerated: "Backup codes regenerated",
  mfa_trusted_device_added: "Device trusted",
  mfa_trusted_device_removed: "Device removed",
  security_settings_updated: "Security settings updated",
};

const ACTION_TONES: Record<string, string> = {
  user_login_failed: "text-[color:var(--pill-red-text)] bg-[color:var(--pill-red-bg)]",
  user_mfa_disabled: "text-[color:var(--pill-amber-text)] bg-[color:var(--pill-amber-bg)]",
  security_settings_updated: "text-[color:var(--pill-blue-text)] bg-[color:var(--pill-blue-bg)]",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function actionTone(action: string): string {
  return ACTION_TONES[action] ?? "text-[color:var(--app-muted)] bg-[color:var(--app-bg)]";
}

function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

function AfterDetails({ after }: { after: unknown }) {
  if (!after || typeof after !== "object") return null;
  const entries = Object.entries(after as Record<string, unknown>).slice(0, 3);
  if (entries.length === 0) return null;
  return (
    <span className="text-xs text-[color:var(--app-muted)]">
      {entries.map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
    </span>
  );
}

const PAGE_SIZE = 50;

const ALL_ACTIONS = [
  "user_login",
  "user_login_failed",
  "user_logout",
  "user_password_reset",
  "user_invite_accepted",
  "user_mfa_enabled",
  "user_mfa_disabled",
  "mfa_backup_codes_regenerated",
  "mfa_trusted_device_added",
  "mfa_trusted_device_removed",
  "security_settings_updated",
];

export function AuditLogClient({ initialLogs, initialTotal, initialPages }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [pages, setPages] = useState(initialPages);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchLogs = useCallback(
    (p: number, action: string, actor: string) => {
      startTransition(async () => {
        const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
        if (action) params.set("action", action);
        if (actor.trim()) params.set("actor", actor.trim());

        const res = await fetch(`/api/audit-log?${params.toString()}`);
        const data = await res.json();
        if (data.ok) {
          setLogs(data.logs);
          setTotal(data.total);
          setPages(data.pages);
          setPage(p);
        }
      });
    },
    []
  );

  function handleActionChange(value: string) {
    setActionFilter(value);
    fetchLogs(1, value, actorFilter);
  }

  function handleActorSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fetchLogs(1, actionFilter, actorFilter);
  }

  function handlePageChange(p: number) {
    fetchLogs(p, actionFilter, actorFilter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleActorSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--app-muted)]" />
            <input
              type="text"
              placeholder="Filter by email…"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="h-8 w-52 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-bg)] pl-8 pr-3 text-xs text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus:border-[color:var(--app-brand)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-bg)] px-3 text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
          >
            Search
          </button>
        </form>

        <select
          value={actionFilter}
          onChange={(e) => handleActionChange(e.target.value)}
          className="h-8 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-bg)] px-3 text-xs text-[color:var(--app-text)] focus:border-[color:var(--app-brand)] focus:outline-none"
        >
          <option value="">All events</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{actionLabel(a)}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => fetchLogs(1, actionFilter, actorFilter)}
          className="ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-bg)] px-3 text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
        >
          <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--app-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--app-border)] bg-[color:var(--app-bg)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--app-muted)]">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--app-muted)]">Event</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--app-muted)]">Actor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--app-muted)] hidden sm:table-cell">Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--app-muted)] hidden lg:table-cell">IP</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-[color:var(--app-border)] bg-[color:var(--app-card)] transition-opacity ${isPending ? "opacity-50" : ""}`}>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[color:var(--app-muted)]">
                  No events found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const { date, time } = formatDate(log.createdAt);
                return (
                  <tr key={log.id} className="hover:bg-[color:var(--app-bg)] transition-colors">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-xs font-medium text-[color:var(--app-text)]">{time}</p>
                      <p className="text-xs text-[color:var(--app-muted)]">{date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${actionTone(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[color:var(--app-text)]">{log.actorEmail ?? "—"}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <AfterDetails after={log.after} />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <p className="font-mono text-xs text-[color:var(--app-muted)]">{log.ipAddress ?? "—"}</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[color:var(--app-muted)]">
            {total.toLocaleString()} event{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--app-border)] text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-[color:var(--app-text)]">
              {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => handlePageChange(page + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--app-border)] text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
