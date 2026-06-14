"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { IntegrationStatusPill } from "@/components/integrations/IntegrationStatusPill";
import type { ProviderAppSummary } from "@/lib/integrations";

type ProviderDraft = {
  clientId: string;
  tenantId: string;
  scopesText: string;
  enabled: boolean;
  rotateSecret: string;
};

function toDraft(provider: ProviderAppSummary): ProviderDraft {
  return {
    clientId: provider.clientId,
    tenantId: provider.tenantId,
    scopesText: provider.scopes.join("\n"),
    enabled: provider.enabled,
    rotateSecret: ""
  };
}

function inputClassName() {
  return "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";
}

export function SystemIntegrationsClient({
  initialProviders
}: {
  initialProviders: ProviderAppSummary[];
}) {
  const [providers, setProviders] = useState(initialProviders);
  const [drafts, setDrafts] = useState<Record<string, ProviderDraft>>(
    Object.fromEntries(initialProviders.map((provider) => [provider.provider, toDraft(provider)]))
  );
  const [pendingAction, setPendingAction] = useState<string>("");
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  const providerMap = useMemo(
    () => Object.fromEntries(providers.map((provider) => [provider.provider, provider])),
    [providers]
  );

  async function reloadProviders() {
    const response = await fetch("/api/integrations/providers");
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; providers?: ProviderAppSummary[]; message?: string };
    if (!response.ok || !data.ok || !Array.isArray(data.providers)) {
      throw new Error(data.message || "Could not refresh integrations.");
    }
    setProviders(data.providers);
    setDrafts(Object.fromEntries(data.providers.map((provider) => [provider.provider, toDraft(provider)])));
  }

  async function saveProvider(providerKey: string) {
    const provider = providerMap[providerKey];
    const draft = drafts[providerKey];
    if (!provider || !draft) return;

    setPendingAction(`save:${providerKey}`);
    setBanner(null);
    try {
      const response = await fetch("/api/integrations/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.provider,
          clientId: draft.clientId.trim(),
          clientSecret: draft.rotateSecret.trim(),
          tenantId: draft.tenantId.trim(),
          enabled: draft.enabled,
          scopes: draft.scopesText
            .split(/\r?\n|,/)
            .map((value) => value.trim())
            .filter(Boolean)
        })
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Could not save provider configuration.");
      }
      await reloadProviders();
      setBanner({ tone: "success", message: `${provider.label} configuration saved.` });
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Could not save provider configuration." });
    } finally {
      setPendingAction("");
    }
  }

  async function rotateSecret(providerKey: string) {
    const provider = providerMap[providerKey];
    const draft = drafts[providerKey];
    if (!provider || !draft?.rotateSecret.trim()) return;

    setPendingAction(`rotate:${providerKey}`);
    setBanner(null);
    try {
      const response = await fetch(`/api/integrations/providers/${provider.provider}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSecret: draft.rotateSecret.trim() })
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Could not rotate secret.");
      }
      await reloadProviders();
      setDrafts((current) => ({
        ...current,
        [providerKey]: {
          ...current[providerKey],
          rotateSecret: ""
        }
      }));
      setBanner({ tone: "success", message: `${provider.label} secret rotated.` });
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Could not rotate secret." });
    } finally {
      setPendingAction("");
    }
  }

  async function testProvider(providerKey: string) {
    const provider = providerMap[providerKey];
    if (!provider) return;

    setPendingAction(`test:${providerKey}`);
    setBanner(null);
    try {
      const response = await fetch(`/api/integrations/providers/${provider.provider}/test`, {
        method: "POST"
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Could not test provider configuration.");
      }
      await reloadProviders();
      setBanner({ tone: "success", message: data.message || `${provider.label} is reachable.` });
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Could not test provider configuration." });
    } finally {
      setPendingAction("");
    }
  }

  async function disableProvider(providerKey: string) {
    const provider = providerMap[providerKey];
    if (!provider) return;

    setPendingAction(`disable:${providerKey}`);
    setBanner(null);
    try {
      const response = await fetch(`/api/integrations/providers/${provider.provider}/disable`, {
        method: "POST"
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Could not disable provider.");
      }
      await reloadProviders();
      setBanner({ tone: "info", message: `${provider.label} disabled.` });
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Could not disable provider." });
    } finally {
      setPendingAction("");
    }
  }

  return (
    <div className="space-y-6">
      {banner ? <NotificationBanner tone={banner.tone}>{banner.message}</NotificationBanner> : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {providers.map((provider) => {
          const draft = drafts[provider.provider];
          const isPending = pendingAction.endsWith(provider.provider);
          return (
            <section
              key={provider.provider}
              className="space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 shadow-[var(--app-shadow-soft)]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-medium text-[color:var(--app-heading)]">{provider.label}</h2>
                    <p className="text-sm text-[color:var(--app-muted)]">{provider.description}</p>
                  </div>
                  <IntegrationStatusPill status={provider.lastHealthStatus === "ready" && provider.enabled ? "ready" : provider.lastHealthStatus} />
                </div>

                <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-xs text-[color:var(--app-muted)]">
                  <p>Redirect URI</p>
                  <p className="mt-1 break-all text-[color:var(--app-heading)]">{provider.redirectUri}</p>
                </div>

                {provider.lastHealthError ? (
                  <div className="rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {provider.lastHealthError}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Client ID</span>
                  <input
                    value={draft.clientId}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [provider.provider]: { ...current[provider.provider], clientId: event.target.value }
                      }))
                    }
                    className={inputClassName()}
                    placeholder={`${provider.label} client ID`}
                  />
                </label>

                {provider.provider === "microsoft" ? (
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Tenant ID</span>
                    <input
                      value={draft.tenantId}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [provider.provider]: { ...current[provider.provider], tenantId: event.target.value }
                        }))
                      }
                      className={inputClassName()}
                      placeholder="common or tenant GUID"
                    />
                  </label>
                ) : null}

                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Scopes</span>
                  <textarea
                    value={draft.scopesText}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [provider.provider]: { ...current[provider.provider], scopesText: event.target.value }
                      }))
                    }
                    rows={6}
                    className={`${inputClassName()} min-h-[144px] resize-y`}
                  />
                </label>

                <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-text)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[color:var(--app-heading)]">Secret status</p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        {provider.secretConfigured ? "A client secret is configured." : "No client secret saved yet."}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-[color:var(--app-muted)]">
                      <input
                        type="checkbox"
                        checked={draft.enabled}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [provider.provider]: { ...current[provider.provider], enabled: event.target.checked }
                          }))
                        }
                      />
                      Enabled
                    </label>
                  </div>
                </div>

                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">Rotate secret</span>
                  <input
                    type="password"
                    value={draft.rotateSecret}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [provider.provider]: { ...current[provider.provider], rotateSecret: event.target.value }
                      }))
                    }
                    className={inputClassName()}
                    placeholder={`New ${provider.label} client secret`}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[color:var(--app-border)] pt-4">
                <Button type="button" onClick={() => saveProvider(provider.provider)} disabled={Boolean(pendingAction)}>
                  {pendingAction === `save:${provider.provider}` ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => testProvider(provider.provider)} disabled={Boolean(pendingAction)}>
                  {pendingAction === `test:${provider.provider}` ? "Testing..." : "Test configuration"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => rotateSecret(provider.provider)}
                  disabled={Boolean(pendingAction) || !draft.rotateSecret.trim()}
                >
                  {pendingAction === `rotate:${provider.provider}` ? "Rotating..." : "Rotate secret"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => disableProvider(provider.provider)} disabled={Boolean(pendingAction)}>
                  {pendingAction === `disable:${provider.provider}` ? "Disabling..." : "Disable provider"}
                </Button>
              </div>

              {isPending ? <p className="text-xs text-[color:var(--app-muted)]">Updating provider settings...</p> : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
