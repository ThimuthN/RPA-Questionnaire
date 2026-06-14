"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { IntegrationStatusPill } from "@/components/integrations/IntegrationStatusPill";
import type { DepartmentIntegrationSummary, IntegrationResourceType } from "@/lib/integrations";

type ResourceDrafts = Partial<Record<IntegrationResourceType, string>>;

function inputClassName() {
  return "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60 focus-visible:ring-2 focus-visible:ring-brand-300/80";
}

function toResourceDrafts(integration: DepartmentIntegrationSummary): ResourceDrafts {
  const defaults: ResourceDrafts = {};
  integration.resources.forEach((resource) => {
    if (resource.isDefault) {
      defaults[resource.resourceType] = resource.id;
    }
  });
  return defaults;
}

function formatTimestamp(value?: string) {
  if (!value) return "Not recorded yet";
  return new Date(value).toLocaleString();
}

const functionLabels: Record<IntegrationResourceType, string> = {
  send_mailbox: "Department mailbox",
  reply_mailbox: "Reply sync",
  calendar: "Scheduling calendar",
  meeting_host: "Meeting provider"
};

export function DepartmentIntegrationsSection({
  departmentId,
  initialIntegrations
}: {
  departmentId: string;
  initialIntegrations: DepartmentIntegrationSummary[];
}) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [drafts, setDrafts] = useState<Record<string, ResourceDrafts>>(
    Object.fromEntries(initialIntegrations.map((integration) => [integration.provider, toResourceDrafts(integration)]))
  );
  const [pendingAction, setPendingAction] = useState("");
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  async function reloadIntegrations() {
    const response = await fetch(`/api/departments/${departmentId}/integrations`);
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      integrations?: DepartmentIntegrationSummary[];
      message?: string;
    };
    if (!response.ok || !data.ok || !Array.isArray(data.integrations)) {
      throw new Error(data.message || "Could not refresh integrations.");
    }
    setIntegrations(data.integrations);
    setDrafts(Object.fromEntries(data.integrations.map((integration) => [integration.provider, toResourceDrafts(integration)])));
  }

  async function startConnection(provider: string) {
    setPendingAction(`connect:${provider}`);
    setBanner(null);
    try {
      const response = await fetch(`/api/departments/${departmentId}/integrations/${provider}/connect/start`, {
        method: "POST"
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; redirectUrl?: string; message?: string };
      if (!response.ok || !data.ok || !data.redirectUrl) {
        throw new Error(data.message || "Could not start provider connection.");
      }
      window.location.assign(data.redirectUrl);
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Could not start provider connection." });
      setPendingAction("");
    }
  }

  async function postAction(provider: string, action: string, body?: unknown, successMessage?: string) {
    setPendingAction(`${action}:${provider}`);
    setBanner(null);
    try {
      const response = await fetch(`/api/departments/${departmentId}/integrations/${provider}/${action}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || `Could not ${action.replace(/-/g, " ")}.`);
      }
      await reloadIntegrations();
      setBanner({ tone: "success", message: successMessage || data.message || "Integration updated." });
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Integration update failed." });
    } finally {
      setPendingAction("");
    }
  }

  return (
    <div className="space-y-6">
      {banner ? <NotificationBanner tone={banner.tone}>{banner.message}</NotificationBanner> : null}

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
        <h3 className="mb-2 font-medium text-[color:var(--app-heading)]">App Integrations</h3>
        <p className="text-sm text-[color:var(--app-muted)]">
          Connect department-owned mailbox, calendar, and meeting resources. Phase 1 covers connection setup,
          defaults, and connection health only. Candidate reply sync and automated scheduling land in later batches.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {integrations.map((integration) => {
          const hasConnection =
            integration.status === "connected" ||
            integration.status === "needs_reauthentication" ||
            integration.status === "sync_issue";
          const resourceGroups = {
            send_mailbox: integration.resources.filter((resource) => resource.resourceType === "send_mailbox"),
            reply_mailbox: integration.resources.filter((resource) => resource.resourceType === "reply_mailbox"),
            calendar: integration.resources.filter((resource) => resource.resourceType === "calendar"),
            meeting_host: integration.resources.filter((resource) => resource.resourceType === "meeting_host")
          };
          const canConfigure = integration.platformEnabled && integration.platformReady;

          return (
            <section
              key={integration.provider}
              className="space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 shadow-[var(--app-shadow-soft)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-[color:var(--app-heading)]">{integration.label}</h2>
                  <p className="text-sm text-[color:var(--app-muted)]">{integration.description}</p>
                </div>
                <IntegrationStatusPill status={integration.status} />
              </div>

              {!canConfigure ? (
                <div className="rounded-[18px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  System setup is incomplete. A system admin must finish provider configuration before this department can connect.
                </div>
              ) : null}

              <div className="grid gap-3 text-sm text-[color:var(--app-text)]">
                <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Connected account</p>
                  <p className="mt-1 text-[color:var(--app-heading)]">{integration.connectedAccountLabel || "Not connected yet"}</p>
                </div>
                <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Connection health</p>
                  <p className="mt-1 text-[color:var(--app-heading)]">{formatTimestamp(integration.lastCheckedAt)}</p>
                  {integration.lastError ? (
                    <p className="mt-2 text-xs text-red-300">{integration.lastError}</p>
                  ) : (
                    <p className="mt-2 text-xs text-[color:var(--app-muted)]">Last successful sync: {formatTimestamp(integration.lastSuccessAt)}</p>
                  )}
                </div>
              </div>

              {integration.resources.length > 0 ? (
                <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                  {(["send_mailbox", "reply_mailbox", "calendar", "meeting_host"] as const).map((resourceType) => {
                    const options = resourceGroups[resourceType];
                    if (options.length === 0) {
                      return null;
                    }

                    return (
                      <label key={resourceType} className="grid gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--app-muted)]">
                          {functionLabels[resourceType]}
                        </span>
                        <select
                          value={drafts[integration.provider]?.[resourceType] ?? ""}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [integration.provider]: {
                                ...current[integration.provider],
                                [resourceType]: event.target.value
                              }
                            }))
                          }
                          className={inputClassName()}
                        >
                          {options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.displayLabel}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={Boolean(pendingAction)}
                      onClick={() =>
                        postAction(
                          integration.provider,
                          "set-defaults",
                          drafts[integration.provider],
                          `${integration.label} defaults saved.`
                        )
                      }
                    >
                      {pendingAction === `set-defaults:${integration.provider}` ? "Saving..." : "Set default"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-[color:var(--app-border)] pt-4">
                {hasConnection ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={Boolean(pendingAction)}
                      onClick={() => postAction(integration.provider, "health-check", undefined, `${integration.label} health refreshed.`)}
                    >
                      {pendingAction === `health-check:${integration.provider}` ? "Checking..." : "Health check"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={Boolean(pendingAction)}
                      onClick={() => postAction(integration.provider, "reset-sync", undefined, `${integration.label} sync reset.`)}
                    >
                      {pendingAction === `reset-sync:${integration.provider}` ? "Resetting..." : "Reset sync"}
                    </Button>
                    {integration.status === "needs_reauthentication" ? (
                      <Button
                        type="button"
                        disabled={Boolean(pendingAction)}
                        onClick={() => startConnection(integration.provider)}
                      >
                        {pendingAction === `connect:${integration.provider}` ? "Redirecting..." : "Reconnect"}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={Boolean(pendingAction)}
                      onClick={() => postAction(integration.provider, "disconnect", undefined, `${integration.label} disconnected.`)}
                    >
                      {pendingAction === `disconnect:${integration.provider}` ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    disabled={!canConfigure || Boolean(pendingAction)}
                    onClick={() => startConnection(integration.provider)}
                  >
                    {pendingAction === `connect:${integration.provider}` ? "Redirecting..." : "Connect"}
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
