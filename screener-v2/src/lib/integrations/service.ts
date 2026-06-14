import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createIntegrationOauthState, consumeIntegrationOauthState } from "@/lib/integrations/oauth-state";
import {
  getIntegrationProviderDescriptor,
  getIntegrationRedirectUri,
  listIntegrationProviders
} from "@/lib/integrations/registry";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "@/lib/integrations/crypto";
import {
  buildMicrosoftAuthorizationUrl,
  exchangeMicrosoftAuthorizationCode,
  loadMicrosoftConnectionDetails,
  refreshMicrosoftToken,
  runMicrosoftHealthCheck
} from "@/lib/integrations/providers/microsoft";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleAuthorizationCode,
  loadGoogleConnectionDetails,
  refreshGoogleToken,
  runGoogleHealthCheck
} from "@/lib/integrations/providers/google";
import {
  buildZoomAuthorizationUrl,
  exchangeZoomAuthorizationCode,
  loadZoomConnectionDetails,
  refreshZoomToken,
  runZoomHealthCheck
} from "@/lib/integrations/providers/zoom";
import type {
  ConnectionHealthResult,
  DepartmentIntegrationSummary,
  DiscoveredIntegrationResource,
  IntegrationConnectionStatus,
  IntegrationProvider,
  IntegrationResourceSummary,
  IntegrationResourceType,
  ProviderAppConfigInput,
  ProviderAppSummary,
  ProviderConnectionDetails,
  ProviderTokenSet
} from "@/lib/integrations/types";

const INTEGRATION_FUNCTION_TYPES: IntegrationResourceType[] = ["send_mailbox", "reply_mailbox", "calendar", "meeting_host"];

function sanitizeIntegrationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/access_token=[^&\s]+/gi, "access_token=[redacted]")
    .replace(/refresh_token=[^&\s]+/gi, "refresh_token=[redacted]")
    .replace(/[A-Za-z0-9_\-]{40,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}/g, "[redacted-token]");
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeScopes(scopes: string[] | undefined, provider: IntegrationProvider) {
  const descriptor = getIntegrationProviderDescriptor(provider);
  const values = (scopes ?? descriptor.defaultScopes).map((value) => value.trim()).filter(Boolean);
  return Array.from(new Set(values));
}

function serializeDate(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function toPrismaMetadataJson(value?: Record<string, unknown>) {
  return value ? (value as Prisma.InputJsonValue) : Prisma.JsonNull;
}

function summarizeResources(resources: Array<{
  id: string;
  resourceType: string;
  externalResourceId: string;
  displayLabel: string;
  emailAddress: string | null;
  isDefault: boolean;
}>): IntegrationResourceSummary[] {
  return resources.map((resource) => ({
    id: resource.id,
    resourceType: resource.resourceType as IntegrationResourceType,
    externalResourceId: resource.externalResourceId,
    displayLabel: resource.displayLabel,
    emailAddress: resource.emailAddress ?? undefined,
    isDefault: resource.isDefault
  }));
}

function toProviderAppConfig(row: {
  provider: string;
  clientId: string | null;
  clientSecretEncrypted: string | null;
  tenantId: string | null;
  scopesJson: unknown;
  enabled: boolean;
}): ProviderAppConfigInput {
  return {
    provider: row.provider as IntegrationProvider,
    clientId: row.clientId ?? undefined,
    clientSecret: row.clientSecretEncrypted ? decryptIntegrationSecret(row.clientSecretEncrypted) : undefined,
    tenantId: row.tenantId ?? undefined,
    enabled: row.enabled,
    scopes: normalizeScopes(asStringArray(row.scopesJson), row.provider as IntegrationProvider)
  };
}

function isProviderAppConfigured(config: ProviderAppConfigInput) {
  const descriptor = getIntegrationProviderDescriptor(config.provider);
  if (!config.clientId?.trim() || !config.clientSecret?.trim()) {
    return false;
  }
  if (descriptor.requiresTenantId && !config.tenantId?.trim()) {
    return false;
  }
  return true;
}

function validateProviderAppInput(input: ProviderAppConfigInput) {
  const descriptor = getIntegrationProviderDescriptor(input.provider);
  if (!input.clientId?.trim()) {
    throw new Error(`${descriptor.label} client ID is required.`);
  }
  if (descriptor.requiresTenantId && !input.tenantId?.trim()) {
    throw new Error(`${descriptor.label} tenant ID is required.`);
  }
  const scopes = normalizeScopes(input.scopes, input.provider);
  if (scopes.length === 0) {
    throw new Error(`${descriptor.label} scopes are required.`);
  }
  return scopes;
}

async function getProviderAppRow(provider: IntegrationProvider) {
  return prisma.integrationProviderApp.findUnique({
    where: { provider }
  });
}

async function requireProviderAppConfig(provider: IntegrationProvider) {
  const row = await getProviderAppRow(provider);
  if (!row) {
    throw new Error(`${getIntegrationProviderDescriptor(provider).label} is not configured yet.`);
  }

  const config = toProviderAppConfig(row);
  if (!isProviderAppConfigured(config)) {
    throw new Error(`${getIntegrationProviderDescriptor(provider).label} is missing required configuration.`);
  }
  if (!row.enabled) {
    throw new Error(`${getIntegrationProviderDescriptor(provider).label} is disabled.`);
  }

  return { row, config };
}

async function testDiscoveryEndpoint(provider: IntegrationProvider) {
  const discoveryUrl = getIntegrationProviderDescriptor(provider).discoveryUrl;
  if (!discoveryUrl) {
    return { status: "ready", error: undefined } as const;
  }

  try {
    const response = await fetch(discoveryUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Discovery returned ${response.status}.`);
    }
    return { status: "ready", error: undefined } as const;
  } catch (error) {
    return { status: "sync_issue", error: sanitizeIntegrationError(error) } as const;
  }
}

function buildAuthorizationUrl(provider: IntegrationProvider, config: ProviderAppConfigInput, redirectUri: string, state: string) {
  if (provider === "microsoft") {
    return buildMicrosoftAuthorizationUrl({ config, redirectUri, state });
  }
  if (provider === "google") {
    return buildGoogleAuthorizationUrl({ config, redirectUri, state });
  }
  return buildZoomAuthorizationUrl({ config, redirectUri, state });
}

async function exchangeAuthorizationCode(
  provider: IntegrationProvider,
  config: ProviderAppConfigInput,
  redirectUri: string,
  code: string
) {
  if (provider === "microsoft") {
    return exchangeMicrosoftAuthorizationCode({ config, redirectUri, code });
  }
  if (provider === "google") {
    return exchangeGoogleAuthorizationCode({ config, redirectUri, code });
  }
  return exchangeZoomAuthorizationCode({ config, redirectUri, code });
}

async function refreshProviderToken(provider: IntegrationProvider, config: ProviderAppConfigInput, refreshToken: string) {
  if (provider === "microsoft") {
    return refreshMicrosoftToken({ config, refreshToken });
  }
  if (provider === "google") {
    return refreshGoogleToken({ config, refreshToken });
  }
  return refreshZoomToken({ config, refreshToken });
}

async function loadProviderConnectionDetails(
  provider: IntegrationProvider,
  config: ProviderAppConfigInput,
  tokenSet: ProviderTokenSet
): Promise<ProviderConnectionDetails> {
  if (provider === "microsoft") {
    return loadMicrosoftConnectionDetails({ config, tokenSet });
  }
  if (provider === "google") {
    return loadGoogleConnectionDetails({ tokenSet });
  }
  return loadZoomConnectionDetails({ tokenSet });
}

async function runProviderConnectionHealthCheck(
  provider: IntegrationProvider,
  config: ProviderAppConfigInput,
  tokenSet: ProviderTokenSet
): Promise<ConnectionHealthResult> {
  if (provider === "microsoft") {
    return runMicrosoftHealthCheck({ config, tokenSet });
  }
  if (provider === "google") {
    return runGoogleHealthCheck({ tokenSet });
  }
  return runZoomHealthCheck({ tokenSet });
}

async function persistDiscoveredResources(connectionId: string, resources: DiscoveredIntegrationResource[]) {
  const existing = await prisma.departmentIntegrationResource.findMany({
    where: { connectionId }
  });
  const existingByKey = new Map(
    existing.map((resource) => [`${resource.resourceType}:${resource.externalResourceId}`, resource] as const)
  );

  const incomingKeys = new Set(resources.map((resource) => `${resource.resourceType}:${resource.externalResourceId}`));
  const obsoleteIds = existing
    .filter((resource) => !incomingKeys.has(`${resource.resourceType}:${resource.externalResourceId}`))
    .map((resource) => resource.id);

  if (obsoleteIds.length > 0) {
    await prisma.departmentIntegrationResource.deleteMany({
      where: { id: { in: obsoleteIds } }
    });
  }

  for (const resource of resources) {
    const existingResource = existingByKey.get(`${resource.resourceType}:${resource.externalResourceId}`);
    const shouldBeDefault =
      existingResource?.isDefault ??
      Boolean(resource.suggestedDefault) ??
      false;

    if (existingResource) {
      await prisma.departmentIntegrationResource.update({
        where: { id: existingResource.id },
        data: {
          displayLabel: resource.displayLabel,
          emailAddress: resource.emailAddress ?? null,
          metadataJson: toPrismaMetadataJson(resource.metadata),
          isDefault: shouldBeDefault
        }
      });
    } else {
      await prisma.departmentIntegrationResource.create({
        data: {
          connectionId,
          resourceType: resource.resourceType,
          externalResourceId: resource.externalResourceId,
          displayLabel: resource.displayLabel,
          emailAddress: resource.emailAddress ?? null,
          metadataJson: toPrismaMetadataJson(resource.metadata),
          isDefault: shouldBeDefault
        }
      });
    }
  }

  for (const resourceType of INTEGRATION_FUNCTION_TYPES) {
    const current = await prisma.departmentIntegrationResource.findMany({
      where: { connectionId, resourceType },
      orderBy: [{ isDefault: "desc" }, { displayLabel: "asc" }]
    });
    if (current.length === 0) {
      continue;
    }
    if (!current.some((resource) => resource.isDefault)) {
      await prisma.departmentIntegrationResource.update({
        where: { id: current[0].id },
        data: { isDefault: true }
      });
    }
  }
}

async function loadConnectionForRefresh(departmentId: string, provider: IntegrationProvider) {
  return prisma.departmentIntegrationConnection.findUnique({
    where: {
      departmentId_provider: {
        departmentId,
        provider
      }
    },
    include: {
      resources: {
        orderBy: [{ resourceType: "asc" }, { displayLabel: "asc" }]
      }
    }
  });
}

async function getConnectionTokenSet(connection: {
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  scopesJson: unknown;
}) {
  return {
    accessToken: connection.accessTokenEncrypted ? decryptIntegrationSecret(connection.accessTokenEncrypted) : "",
    refreshToken: connection.refreshTokenEncrypted ? decryptIntegrationSecret(connection.refreshTokenEncrypted) : undefined,
    expiresAt: connection.tokenExpiresAt ?? undefined,
    scopes: asStringArray(connection.scopesJson)
  } satisfies ProviderTokenSet;
}

async function refreshConnectionIfNeeded(departmentId: string, provider: IntegrationProvider) {
  const connection = await loadConnectionForRefresh(departmentId, provider);
  if (!connection) {
    throw new Error(`${getIntegrationProviderDescriptor(provider).label} is not connected for this department.`);
  }

  const { config } = await requireProviderAppConfig(provider);
  const tokenSet = await getConnectionTokenSet(connection);
  const expiresAt = tokenSet.expiresAt?.getTime() ?? 0;
  if (tokenSet.accessToken && (!expiresAt || expiresAt > Date.now() + 60_000)) {
    return { connection, config, tokenSet };
  }

  if (!tokenSet.refreshToken) {
    await prisma.departmentIntegrationConnection.update({
      where: { id: connection.id },
      data: {
        status: "needs_reauthentication",
        lastError: "Refresh token is missing. Reconnect the provider."
      }
    });
    throw new Error("Refresh token is missing. Reconnect the provider.");
  }

  const refreshed = await refreshProviderToken(provider, config, tokenSet.refreshToken);
  await prisma.departmentIntegrationConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptIntegrationSecret(refreshed.accessToken),
      refreshTokenEncrypted: refreshed.refreshToken
        ? encryptIntegrationSecret(refreshed.refreshToken)
        : connection.refreshTokenEncrypted,
      tokenExpiresAt: refreshed.expiresAt ?? null,
      scopesJson: refreshed.scopes ?? tokenSet.scopes ?? []
    }
  });

  return {
    connection: await loadConnectionForRefresh(departmentId, provider).then((value) => value!),
    config,
    tokenSet: {
      ...refreshed,
      refreshToken: refreshed.refreshToken ?? tokenSet.refreshToken
    }
  };
}

export async function listProviderAppSummaries(): Promise<ProviderAppSummary[]> {
  const rows = await prisma.integrationProviderApp.findMany();
  const rowByProvider = new Map(rows.map((row) => [row.provider as IntegrationProvider, row]));

  return listIntegrationProviders().map((descriptor) => {
    const row = rowByProvider.get(descriptor.provider);
    const config = row ? toProviderAppConfig(row) : {
      provider: descriptor.provider,
      enabled: false,
      scopes: descriptor.defaultScopes
    };

    return {
      provider: descriptor.provider,
      label: descriptor.label,
      description: descriptor.description,
      capabilities: descriptor.capabilities,
      authType: descriptor.authType,
      redirectUri: getIntegrationRedirectUri(descriptor.provider),
      documentationLabel: descriptor.documentationLabel,
      enabled: row?.enabled ?? false,
      isConfigured: isProviderAppConfigured(config),
      clientId: row?.clientId ?? "",
      tenantId: row?.tenantId ?? "",
      scopes: normalizeScopes(asStringArray(row?.scopesJson), descriptor.provider),
      recommendedScopes: descriptor.defaultScopes,
      secretConfigured: Boolean(row?.clientSecretEncrypted),
      lastHealthStatus: row?.lastHealthStatus ?? "not_configured",
      lastHealthError: row?.lastHealthError ?? undefined,
      lastCheckedAt: serializeDate(row?.lastCheckedAt)
    };
  });
}

export async function saveProviderAppConfiguration(input: ProviderAppConfigInput) {
  const scopes = validateProviderAppInput(input);
  const row = await prisma.integrationProviderApp.upsert({
    where: { provider: input.provider },
    update: {
      clientId: input.clientId?.trim() || null,
      clientSecretEncrypted: input.clientSecret?.trim()
        ? encryptIntegrationSecret(input.clientSecret.trim())
        : undefined,
      tenantId: input.tenantId?.trim() || null,
      scopesJson: scopes,
      enabled: input.enabled
    },
    create: {
      provider: input.provider,
      clientId: input.clientId?.trim() || null,
      clientSecretEncrypted: input.clientSecret?.trim() ? encryptIntegrationSecret(input.clientSecret.trim()) : null,
      tenantId: input.tenantId?.trim() || null,
      scopesJson: scopes,
      enabled: input.enabled
    }
  });

  return row.provider;
}

export async function rotateProviderAppSecret(provider: IntegrationProvider, clientSecret: string) {
  if (!clientSecret.trim()) {
    throw new Error("A new client secret is required.");
  }
  await prisma.integrationProviderApp.update({
    where: { provider },
    data: {
      clientSecretEncrypted: encryptIntegrationSecret(clientSecret.trim())
    }
  });
}

export async function setProviderAppEnabled(provider: IntegrationProvider, enabled: boolean) {
  await prisma.integrationProviderApp.upsert({
    where: { provider },
    update: { enabled },
    create: { provider, enabled }
  });
}

export async function testProviderAppConfiguration(provider: IntegrationProvider) {
  const row = await getProviderAppRow(provider);
  if (!row) {
    throw new Error(`${getIntegrationProviderDescriptor(provider).label} is not configured yet.`);
  }

  const config = toProviderAppConfig(row);
  if (!isProviderAppConfigured(config)) {
    await prisma.integrationProviderApp.update({
      where: { provider },
      data: {
        lastHealthStatus: "not_configured",
        lastHealthError: "Required provider fields are missing.",
        lastCheckedAt: new Date()
      }
    });
    return { status: "not_configured", message: "Required provider fields are missing." };
  }

  const discovery = await testDiscoveryEndpoint(provider);
  await prisma.integrationProviderApp.update({
    where: { provider },
    data: {
      lastHealthStatus: discovery.status,
      lastHealthError: discovery.error ?? null,
      lastCheckedAt: new Date()
    }
  });

  return {
    status: discovery.status,
    message:
      discovery.error ??
      `${getIntegrationProviderDescriptor(provider).label} metadata endpoint is reachable. Department OAuth consent and resource access are validated when a department connects.`
  };
}

export async function listDepartmentIntegrationSummaries(departmentId: string): Promise<DepartmentIntegrationSummary[]> {
  const providerRows = await prisma.integrationProviderApp.findMany();
  const providerById = new Map(providerRows.map((row) => [row.provider as IntegrationProvider, row]));
  const connections = await prisma.departmentIntegrationConnection.findMany({
    where: { departmentId },
    include: {
      resources: {
        orderBy: [{ resourceType: "asc" }, { displayLabel: "asc" }]
      }
    }
  });
  const connectionByProvider = new Map(connections.map((connection) => [connection.provider as IntegrationProvider, connection]));

  return listIntegrationProviders().map((descriptor) => {
    const providerRow = providerById.get(descriptor.provider);
    const connection = connectionByProvider.get(descriptor.provider);
    const platformConfig = providerRow ? toProviderAppConfig(providerRow) : {
      provider: descriptor.provider,
      enabled: false,
      scopes: descriptor.defaultScopes
    };

    return {
      provider: descriptor.provider,
      label: descriptor.label,
      description: descriptor.description,
      capabilities: descriptor.capabilities,
      platformEnabled: providerRow?.enabled ?? false,
      platformReady: isProviderAppConfigured(platformConfig) && Boolean(providerRow?.enabled),
      status: (connection?.status as IntegrationConnectionStatus | undefined) ?? "not_connected",
      connectedAccountLabel: connection?.connectedAccountLabel ?? undefined,
      connectedTenantId: connection?.connectedTenantId ?? undefined,
      lastSuccessAt: serializeDate(connection?.lastSuccessAt),
      lastError: connection?.lastError ?? undefined,
      lastCheckedAt: serializeDate(connection?.lastCheckedAt),
      resources: connection ? summarizeResources(connection.resources) : []
    };
  });
}

export async function startDepartmentProviderConnection(departmentId: string, provider: IntegrationProvider) {
  const { config } = await requireProviderAppConfig(provider);
  const redirectUri = getIntegrationRedirectUri(provider);
  const state = await createIntegrationOauthState(provider, departmentId);
  return {
    redirectUrl: buildAuthorizationUrl(provider, config, redirectUri, state)
  };
}

export async function completeDepartmentProviderConnection(input: {
  provider: IntegrationProvider;
  state: string;
  code: string;
}) {
  const statePayload = await consumeIntegrationOauthState(input.state);
  if (statePayload.provider !== input.provider) {
    throw new Error("Integration authorization state does not match this provider.");
  }

  const { config } = await requireProviderAppConfig(input.provider);
  const redirectUri = getIntegrationRedirectUri(input.provider);
  const tokenSet = await exchangeAuthorizationCode(input.provider, config, redirectUri, input.code);
  const details = await loadProviderConnectionDetails(input.provider, config, tokenSet);

  const connection = await prisma.departmentIntegrationConnection.upsert({
    where: {
      departmentId_provider: {
        departmentId: statePayload.departmentId,
        provider: input.provider
      }
    },
    update: {
      status: "connected",
      connectedAccountId: details.identity.accountId,
      connectedAccountLabel: details.identity.accountLabel,
      connectedTenantId: details.identity.tenantId ?? null,
      scopesJson: details.scopes,
      accessTokenEncrypted: encryptIntegrationSecret(details.tokenSet.accessToken),
      refreshTokenEncrypted: details.tokenSet.refreshToken
        ? encryptIntegrationSecret(details.tokenSet.refreshToken)
        : null,
      tokenExpiresAt: details.tokenSet.expiresAt ?? null,
      lastSuccessAt: new Date(),
      lastError: null,
      lastCheckedAt: new Date()
    },
    create: {
      departmentId: statePayload.departmentId,
      provider: input.provider,
      status: "connected",
      connectedAccountId: details.identity.accountId,
      connectedAccountLabel: details.identity.accountLabel,
      connectedTenantId: details.identity.tenantId ?? null,
      scopesJson: details.scopes,
      accessTokenEncrypted: encryptIntegrationSecret(details.tokenSet.accessToken),
      refreshTokenEncrypted: details.tokenSet.refreshToken
        ? encryptIntegrationSecret(details.tokenSet.refreshToken)
        : null,
      tokenExpiresAt: details.tokenSet.expiresAt ?? null,
      lastSuccessAt: new Date(),
      lastCheckedAt: new Date()
    }
  });

  await persistDiscoveredResources(connection.id, details.resources);
  return {
    connectionId: connection.id,
    departmentId: statePayload.departmentId
  };
}

export async function disconnectDepartmentProvider(departmentId: string, provider: IntegrationProvider) {
  const connection = await prisma.departmentIntegrationConnection.findUnique({
    where: {
      departmentId_provider: {
        departmentId,
        provider
      }
    }
  });

  if (!connection) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.integrationSyncCursor.deleteMany({ where: { connectionId: connection.id } });
    await tx.integrationWebhookSubscription.deleteMany({ where: { connectionId: connection.id } });
    await tx.departmentIntegrationResource.deleteMany({ where: { connectionId: connection.id } });
    await tx.departmentIntegrationConnection.update({
      where: { id: connection.id },
      data: {
        status: "disconnected",
        connectedAccountId: null,
        connectedAccountLabel: null,
        connectedTenantId: null,
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        tokenExpiresAt: null,
        lastError: null,
        lastCheckedAt: new Date()
      }
    });
  });
}

export async function setDepartmentProviderDefaults(
  departmentId: string,
  provider: IntegrationProvider,
  defaults: Partial<Record<IntegrationResourceType, string>>
) {
  const connection = await loadConnectionForRefresh(departmentId, provider);
  if (!connection) {
    throw new Error("Connection not found.");
  }

  for (const resourceType of INTEGRATION_FUNCTION_TYPES) {
    const selectedId = defaults[resourceType];
    if (!selectedId) {
      continue;
    }

    const selectedResource = connection.resources.find(
      (resource) => resource.id === selectedId && resource.resourceType === resourceType
    );
    if (!selectedResource) {
      throw new Error(`Selected ${resourceType} is invalid.`);
    }

    await prisma.departmentIntegrationResource.updateMany({
      where: { connectionId: connection.id, resourceType },
      data: { isDefault: false }
    });
    await prisma.departmentIntegrationResource.update({
      where: { id: selectedId },
      data: { isDefault: true }
    });
  }
}

export async function resetDepartmentProviderSync(departmentId: string, provider: IntegrationProvider) {
  const connection = await prisma.departmentIntegrationConnection.findUnique({
    where: {
      departmentId_provider: {
        departmentId,
        provider
      }
    }
  });

  if (!connection) {
    throw new Error("Connection not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.integrationSyncCursor.deleteMany({ where: { connectionId: connection.id } });
    await tx.integrationWebhookSubscription.deleteMany({ where: { connectionId: connection.id } });
    await tx.departmentIntegrationConnection.update({
      where: { id: connection.id },
      data: {
        lastError: null,
        lastCheckedAt: new Date()
      }
    });
  });
}

export async function runDepartmentProviderHealthCheck(departmentId: string, provider: IntegrationProvider) {
  const { connection, config, tokenSet } = await refreshConnectionIfNeeded(departmentId, provider);
  const result = await runProviderConnectionHealthCheck(provider, config, tokenSet);

  const nextStatus: IntegrationConnectionStatus =
    result.status === "connected" ? "connected" : result.status === "needs_reauthentication" ? "needs_reauthentication" : "sync_issue";

  await prisma.departmentIntegrationConnection.update({
    where: { id: connection.id },
    data: {
      status: nextStatus,
      connectedAccountId: result.identity?.accountId ?? connection.connectedAccountId,
      connectedAccountLabel: result.identity?.accountLabel ?? connection.connectedAccountLabel,
      connectedTenantId: result.identity?.tenantId ?? connection.connectedTenantId,
      lastSuccessAt: result.status === "connected" ? new Date() : connection.lastSuccessAt,
      lastError: result.lastError ?? null,
      lastCheckedAt: result.checkedAt,
      accessTokenEncrypted: result.tokenSet?.accessToken
        ? encryptIntegrationSecret(result.tokenSet.accessToken)
        : connection.accessTokenEncrypted,
      refreshTokenEncrypted: result.tokenSet?.refreshToken
        ? encryptIntegrationSecret(result.tokenSet.refreshToken)
        : connection.refreshTokenEncrypted,
      tokenExpiresAt: result.tokenSet?.expiresAt ?? connection.tokenExpiresAt,
      scopesJson: result.tokenSet?.scopes ?? asStringArray(connection.scopesJson)
    }
  });

  if (result.resources) {
    await persistDiscoveredResources(connection.id, result.resources);
  }

  return {
    status: nextStatus,
    message:
      result.lastError ??
      `${getIntegrationProviderDescriptor(provider).label} connection is healthy.`
  };
}
