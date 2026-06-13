"use client";

import { useState, useCallback } from "react";
import { Mail, RefreshCw, ChevronDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface EmailLogEntry {
  id: string;
  to: string;
  cc?: string | null;
  subject: string;
  template: string;
  status: string;
  errorMsg?: string | null;
  sentAt: string;
  sentBy?: { id: string; name?: string | null; email: string } | null;
}

const TEMPLATE_LABELS: Record<string, { label: string; color: string }> = {
  ad_hoc: { label: "Custom", color: "bg-slate-500/20 text-slate-300" },
  application_received: { label: "Application received", color: "bg-blue-500/20 text-blue-300" },
  interview_invite: { label: "Interview invite", color: "bg-violet-500/20 text-violet-300" },
  stage_advance: { label: "Stage advance", color: "bg-emerald-500/20 text-emerald-300" },
  rejection: { label: "Rejection", color: "bg-red-500/20 text-red-300" },
  offer_sent: { label: "Offer letter", color: "bg-amber-500/20 text-amber-300" },
  screener_invite: { label: "Assessment", color: "bg-cyan-500/20 text-cyan-300" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TemplateBadge({ template }: { template: string }) {
  const cfg = TEMPLATE_LABELS[template] ?? { label: template, color: "bg-slate-500/20 text-slate-300" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "sent") return <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />;
  if (status === "failed") return <AlertCircle size={13} className="text-red-400 flex-shrink-0" />;
  return <Clock size={13} className="text-[color:var(--app-muted)] flex-shrink-0" />;
}

function EmailRow({ log }: { log: EmailLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[color:var(--app-surface)]"
      >
        <StatusIcon status={log.status} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-medium text-[color:var(--app-heading)]">{log.subject}</p>
          <div className="flex flex-wrap items-center gap-2">
            <TemplateBadge template={log.template} />
            <span className="text-[11px] text-[color:var(--app-muted)]">→ {log.to}</span>
            <span className="text-[11px] text-[color:var(--app-muted)]">{formatDate(log.sentAt)}</span>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`mt-0.5 flex-shrink-0 text-[color:var(--app-muted)] transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[color:var(--app-border)] px-4 py-3 space-y-2 bg-[color:var(--app-surface)]">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
            <span className="text-[color:var(--app-muted)]">To</span>
            <span className="text-[color:var(--app-text)]">{log.to}</span>
            {log.cc && (
              <>
                <span className="text-[color:var(--app-muted)]">CC</span>
                <span className="text-[color:var(--app-text)]">{log.cc}</span>
              </>
            )}
            <span className="text-[color:var(--app-muted)]">Sent</span>
            <span className="text-[color:var(--app-text)]">{new Date(log.sentAt).toLocaleString()}</span>
            {log.sentBy && (
              <>
                <span className="text-[color:var(--app-muted)]">By</span>
                <span className="text-[color:var(--app-text)]">{log.sentBy.name ?? log.sentBy.email}</span>
              </>
            )}
            {log.status === "failed" && log.errorMsg && (
              <>
                <span className="text-red-400">Error</span>
                <span className="text-red-300">{log.errorMsg}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface EmailLogPanelProps {
  candidateId: string;
  initialLogs?: EmailLogEntry[];
}

export function EmailLogPanel({ candidateId, initialLogs = [] }: EmailLogPanelProps) {
  const [logs, setLogs] = useState<EmailLogEntry[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/emails`);
      const data = (await res.json()) as { logs?: EmailLogEntry[] };
      setLogs(data.logs ?? []);
    } catch {
      setError("Failed to load email history.");
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail size={15} className="text-[color:var(--app-muted)]" />
          <p className="text-sm font-medium text-[color:var(--app-heading)]">
            {logs.length} email{logs.length !== 1 ? "s" : ""} sent
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)] transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {logs.length === 0 ? (
        <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-5 py-8 text-center">
          <Mail size={22} className="mx-auto mb-3 text-[color:var(--app-muted)]" />
          <p className="text-sm font-medium text-[color:var(--app-heading)]">No emails sent yet</p>
          <p className="mt-1 text-xs text-[color:var(--app-muted)]">
            Use the Send email button to contact this candidate or loop in the hiring team.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <EmailRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
