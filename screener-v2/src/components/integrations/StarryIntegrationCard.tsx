"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";

type Status = {
  enabled: boolean;
  hasKey: boolean;
  providerKind: "anthropic" | "openai";
  model: string;
  baseUrl: string;
  encryptionReady: boolean;
};

const inputClass =
  "w-full rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none focus:border-[color:var(--app-brand)]";

export function StarryIntegrationCard({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState(initialStatus);
  const [providerKind, setProviderKind] = useState(initialStatus.providerKind);
  const [model, setModel] = useState(initialStatus.model);
  const [baseUrl, setBaseUrl] = useState(initialStatus.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(initialStatus.enabled);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/integrations/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerKind, model, baseUrl, apiKey: apiKey || undefined, enabled })
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; status?: Status };
      if (!res.ok || data.ok === false || !data.status) throw new Error(data.message || "Could not save.");
      setStatus(data.status);
      setApiKey("");
      setMsg({ tone: "ok", text: "Starry settings saved." });
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  const statusPill = status.enabled
    ? { label: "Connected", tone: "emerald" as const }
    : status.hasKey
      ? { label: "Disabled", tone: "neutral" as const }
      : { label: "Not configured", tone: "amber" as const };

  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-medium text-[color:var(--app-heading)]">Starry — AI Assistant</h3>
            <p className="text-sm text-[color:var(--app-muted)]">
              Connect a model provider to enable the in-app AI assistant (résumé review, role-fit, screening questions, email drafts).
            </p>
          </div>
        </div>
        <StatusPill label={statusPill.label} tone={statusPill.tone} />
      </div>

      {!status.encryptionReady ? (
        <p className="mt-4 rounded-[12px] border border-[color:var(--app-danger-soft)] bg-[color:var(--app-danger-soft)] px-3 py-2 text-sm text-[color:var(--app-danger)]">
          INTEGRATIONS_ENCRYPTION_KEY is missing — the API key cannot be stored securely until it is set.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Provider</span>
          <select value={providerKind} onChange={(e) => setProviderKind(e.target.value as "anthropic" | "openai")} className={inputClass}>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI-compatible (OpenAI / local model)</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Model</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. claude-sonnet-4-6" className={inputClass} />
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className="text-sm text-[color:var(--app-text)]">API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={status.hasKey ? "•••••••••• (stored — leave blank to keep)" : "Paste the provider API key"}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className="text-sm text-[color:var(--app-text)]">
            Base URL <span className="text-[color:var(--app-muted)]">(optional — for a local or self-hosted model)</span>
          </span>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="e.g. http://localhost:11434  (leave blank for the provider default)" className={inputClass} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--app-border)] pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--app-text)]">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-[color:var(--app-border-strong)] accent-[color:var(--app-brand)]" />
          Enable Starry across the platform
        </label>
        <div className="flex items-center gap-3">
          {msg ? (
            <span className={msg.tone === "ok" ? "text-sm text-[color:var(--app-success)]" : "text-sm text-[color:var(--app-danger)]"}>{msg.text}</span>
          ) : null}
          <Button type="button" onClick={save} disabled={saving || !status.encryptionReady}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
