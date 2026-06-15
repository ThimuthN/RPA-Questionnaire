"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { IntegrationStatusPill } from "@/components/integrations/IntegrationStatusPill";
import { InfoTooltip } from "@/components/primitives/InfoTooltip";
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

function fieldHelp(
  provider: ProviderAppSummary,
  field: "clientId" | "tenantId" | "scopes" | "secret"
) {
  if (provider.provider === "microsoft") {
    if (field === "clientId") {
      return "Paste the Application (client) ID from the Azure / Entra app registration.";
    }
    if (field === "tenantId") {
      return "Use the Microsoft Entra tenant GUID for the organization that owns this app registration.";
    }
    if (field === "scopes") {
      return "One Microsoft Graph delegated permission per line. Use the recommended list unless you are deliberately changing the permission model.";
    }
    return provider.secretConfigured
      ? "Enter a new client secret only when rotating it. Saved secrets are never shown again."
      : "Paste the client secret value generated in the app registration. It is stored once and never shown again.";
  }

  if (provider.provider === "google") {
    if (field === "clientId") {
      return "Paste the OAuth client ID from the Google Cloud OAuth client.";
    }
    if (field === "scopes") {
      return "One Google OAuth scope per line. Use the recommended list unless you intentionally need a different permission set.";
    }
    return provider.secretConfigured
      ? "Enter a new client secret only when rotating it."
      : "Paste the Google OAuth client secret value.";
  }

  if (field === "clientId") {
    return "Paste the Zoom OAuth app client ID.";
  }
  if (field === "scopes") {
    return "One Zoom OAuth scope per line.";
  }
  return provider.secretConfigured
    ? "Enter a new client secret only when rotating it."
    : "Paste the Zoom OAuth client secret value.";
}

function scopeExamples(provider: ProviderAppSummary) {
  return provider.recommendedScopes.slice(0, Math.min(provider.recommendedScopes.length, 4));
}

function shouldConfirmProviderAction(action: "disable" | "rotate", provider: ProviderAppSummary) {
  if (action === "disable") {
    return window.confirm(
      `Disable ${provider.label} for new department connections? Existing department mappings remain stored, but teams will not be able to reconnect until the provider is enabled again.`
    );
  }

  return window.confirm(
    `Rotate the ${provider.label} client secret now? Departments using this provider may need to reconnect if the new secret does not match the app registration.`
  );
}

function tenantPlaceholder(provider: ProviderAppSummary) {
  if (provider.provider === "microsoft") {
    return "Azure / Entra tenant GUID";
  }
  return "";
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
    if (!shouldConfirmProviderAction("rotate", provider)) return;

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
    if (!shouldConfirmProviderAction("disable", provider)) return;

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
                  <div className="flex items-center gap-1.5">
                    <p>Redirect URI</p>
                    <InfoTooltip content="Add this exact callback URL to the provider app registration before saving." />
                  </div>
                  <p className="mt-1 break-all font-mono text-[color:var(--app-heading)]">{provider.redirectUri}</p>
                </div>

                {provider.lastHealthError ? (
                  <div className="rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {provider.lastHealthError}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <label className="grid gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                    Client ID
                    <InfoTooltip content={fieldHelp(provider, "clientId")} />
                  </span>
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
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                      Tenant ID
                      <InfoTooltip content={fieldHelp(provider, "tenantId")} />
                    </span>
                    <input
                      value={draft.tenantId}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [provider.provider]: { ...current[provider.provider], tenantId: event.target.value }
                        }))
                      }
                      className={inputClassName()}
                      placeholder={tenantPlaceholder(provider)}
                    />
                  </label>
                ) : null}

                <label className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                      Scopes
                      <InfoTooltip content={`${fieldHelp(provider, "scopes")} Example: ${scopeExamples(provider).slice(0, 2).join(", ")}`} />
                    </span>
                    <button
                      type="button"
                      className="text-xs font-medium text-[color:var(--app-brand)] hover:text-[color:var(--app-brand-strong)]"
                      onClick={() =>
                        setDrafts((current) => ({
                          ...current,
                          [provider.provider]: {
                            ...current[provider.provider],
                            scopesText: provider.recommendedScopes.join("\n")
                          }
                        }))
                      }
                    >
                      Use recommended
                    </button>
                  </div>
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
                    placeholder={provider.recommendedScopes.join("\n")}
                    spellCheck={false}
                  />
                </label>

                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[color:var(--app-heading)]">
                      {provider.secretConfigured ? "Secret configured" : "No secret saved"}
                    </span>
                    <InfoTooltip content={fieldHelp(provider, "secret")} />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[color:var(--app-muted)]">
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

                <label className="grid gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                    Client secret
                    <InfoTooltip content={provider.secretConfigured ? "Enter a new value only when rotating. Saved secrets are never shown again." : "Paste the client secret generated in the app registration. Stored once, never shown again."} />
                  </span>
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
                    placeholder={
                      provider.secretConfigured
                        ? `Paste a new ${provider.label} client secret to rotate`
                        : `Paste the ${provider.label} client secret`
                    }
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--app-border)] pt-4">
                <Button type="button" onClick={() => saveProvider(provider.provider)} disabled={Boolean(pendingAction)}>
                  {pendingAction === `save:${provider.provider}` ? "Saving..." : "Save"}
                </Button>
                <div className="flex items-center gap-1.5">
                  <Button type="button" variant="secondary" onClick={() => testProvider(provider.provider)} disabled={Boolean(pendingAction)}>
                    {pendingAction === `test:${provider.provider}` ? "Checking..." : "Validate setup"}
                  </Button>
                  <InfoTooltip content="Checks the provider metadata endpoint and confirms required fields are present. Does not verify department OAuth consent or mailbox/calendar access." />
                </div>
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
