import { SystemIntegrationsClient } from "@/components/integrations/SystemIntegrationsClient";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { SceneShell } from "@/components/scene/SceneShell";
import { requireGlobalPagePermission, requirePageSession } from "@/lib/auth/guards";
import { hasIntegrationEncryptionKey, listProviderAppSummaries } from "@/lib/integrations";

export default async function IntegrationsPage() {
  const session = await requirePageSession("/integrations");
  await requireGlobalPagePermission(session, "manage_integrations");

  const [providers, encryptionReady] = await Promise.all([
    listProviderAppSummaries(),
    Promise.resolve(hasIntegrationEncryptionKey())
  ]);

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Admin"
      title="App Integrations"
      subtitle="Configure provider apps once, then let each department connect its own mailbox, scheduling calendar, and meeting provider."
    >
      <div className="space-y-6">
        {!encryptionReady ? (
          <NotificationBanner tone="error">
            `INTEGRATIONS_ENCRYPTION_KEY` is missing. Provider secrets and OAuth tokens cannot be stored safely until it is configured.
          </NotificationBanner>
        ) : null}

        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <h2 className="mb-2 text-lg font-medium text-[color:var(--app-heading)]">Provider app registrations</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            This is the system-owned setup layer. Save provider registration metadata here, verify connection health,
            and keep supported providers ready for department-level connections.
          </p>
        </div>

        <SystemIntegrationsClient initialProviders={providers} />
      </div>
    </SceneShell>
  );
}
