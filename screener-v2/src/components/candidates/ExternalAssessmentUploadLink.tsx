"use client";

import { useState } from "react";
import { Link2, Copy, Check, Mail } from "lucide-react";

export function ExternalAssessmentUploadLink({
  candidateId,
  assessmentId,
  candidateEmail
}: {
  candidateId: string;
  assessmentId: string;
  candidateEmail?: string;
}) {
  const [state, setState] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function generate() {
    setState("generating");
    try {
      const res = await fetch(
        `/api/candidates/${candidateId}/external-assessments/${assessmentId}/upload-token`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
      );
      const data = await res.json().catch(() => ({})) as { url?: string; expiresAt?: string; error?: string };
      if (!res.ok || data.error) { setState("error"); return; }
      setUrl(data.url ?? null);
      setExpiresAt(data.expiresAt ?? null);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmail() {
    if (!url || !candidateEmail) return;
    setEmailState("sending");
    try {
      const res = await fetch(`/api/candidates/${candidateId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: candidateEmail,
          subject: "Please upload your assessment files",
          body: `Hi,\n\nPlease use the link below to securely upload your assessment files. This link is single-use and expires on ${expiresAt ? new Date(expiresAt).toLocaleDateString() : "soon"}.\n\n${url}\n\nIf you have any questions, please reach out to the hiring team.\n\nBest regards,\nThe Hiring Team`
        })
      });
      setEmailState(res.ok ? "sent" : "error");
    } catch {
      setEmailState("error");
    }
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={generate}
        className="inline-flex items-center gap-1.5 text-xs text-[color:var(--app-muted)] transition hover:text-[color:var(--app-brand)]"
      >
        <Link2 className="h-3 w-3" />
        Generate upload link
      </button>
    );
  }

  if (state === "generating") {
    return <p className="text-xs text-[color:var(--app-muted)]">Generating link…</p>;
  }

  if (state === "error") {
    return (
      <p className="text-xs text-[color:var(--app-danger)]">
        Failed to generate link.{" "}
        <button type="button" onClick={() => setState("idle")} className="underline hover:no-underline">Retry</button>
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-[color:var(--app-border)] pt-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
        Upload link · expires {expiresAt ? new Date(expiresAt).toLocaleDateString() : "in 7 days"}
      </p>

      {/* Link row */}
      <div className="flex items-center gap-2 rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-xs text-[color:var(--app-text)] font-mono">{url}</p>
        <button
          type="button"
          onClick={copyLink}
          title="Copy link"
          className="flex-shrink-0 rounded p-1 text-[color:var(--app-muted)] transition hover:text-[color:var(--app-brand)]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Send email */}
      {candidateEmail && (
        <div className="flex items-center gap-3">
          {emailState === "sent" ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Email sent to {candidateEmail}
            </span>
          ) : emailState === "error" ? (
            <span className="text-xs text-[color:var(--app-danger)]">Failed to send email.</span>
          ) : (
            <button
              type="button"
              onClick={sendEmail}
              disabled={emailState === "sending"}
              className="inline-flex items-center gap-1.5 text-xs text-[color:var(--app-muted)] transition hover:text-[color:var(--app-brand)] disabled:opacity-50"
            >
              <Mail className="h-3 w-3" />
              {emailState === "sending" ? "Sending…" : `Send to ${candidateEmail}`}
            </button>
          )}

          <span className="text-[color:var(--app-border)]">·</span>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
          >
            Generate new link
          </button>
        </div>
      )}

      <p className="text-[11px] text-[color:var(--app-muted)]">
        Single-use — this link becomes inactive after the candidate uploads their files.
      </p>
    </div>
  );
}
