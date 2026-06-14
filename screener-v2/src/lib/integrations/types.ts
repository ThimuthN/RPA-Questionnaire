export const integrationProviders = ["microsoft", "google", "zoom"] as const;
export type IntegrationProvider = (typeof integrationProviders)[number];

export const integrationResourceTypes = ["send_mailbox", "reply_mailbox", "calendar", "meeting_host"] as const;
export type IntegrationResourceType = (typeof integrationResourceTypes)[number];

export const integrationConnectionStatuses = [
  "not_connected",
  "connected",
  "needs_reauthentication",
  "sync_issue",
  "disconnected"
] as const;
export type IntegrationConnectionStatus = (typeof integrationConnectionStatuses)[number];

export type IntegrationProviderDescriptor = {
  provider: IntegrationProvider;
  label: string;
  description: string;
  capabilities: Array<"mail" | "calendar" | "meetings">;
  authType: "oauth";
  requiresTenantId?: boolean;
  redirectPath: string;
  documentationLabel: string;
  discoveryUrl?: string;
  defaultScopes: string[];
};

export type ProviderAppConfigInput = {
  provider: IntegrationProvider;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  enabled: boolean;
  scopes: string[];
};

export type ProviderAppSummary = {
  provider: IntegrationProvider;
  label: string;
  description: string;
  capabilities: Array<"mail" | "calendar" | "meetings">;
  authType: "oauth";
  redirectUri: string;
  documentationLabel: string;
  enabled: boolean;
  isConfigured: boolean;
  clientId: string;
  tenantId: string;
  scopes: string[];
  recommendedScopes: string[];
  secretConfigured: boolean;
  lastHealthStatus: string;
  lastHealthError?: string;
  lastCheckedAt?: string;
};

export type IntegrationResourceSummary = {
  id: string;
  resourceType: IntegrationResourceType;
  externalResourceId: string;
  displayLabel: string;
  emailAddress?: string;
  isDefault: boolean;
};

export type DepartmentIntegrationSummary = {
  provider: IntegrationProvider;
  label: string;
  description: string;
  capabilities: Array<"mail" | "calendar" | "meetings">;
  platformEnabled: boolean;
  platformReady: boolean;
  status: IntegrationConnectionStatus;
  connectedAccountLabel?: string;
  connectedTenantId?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastCheckedAt?: string;
  resources: IntegrationResourceSummary[];
};

export type DiscoveredIntegrationResource = {
  resourceType: IntegrationResourceType;
  externalResourceId: string;
  displayLabel: string;
  emailAddress?: string;
  metadata?: Record<string, unknown>;
  suggestedDefault?: boolean;
};

export type ProviderConnectionIdentity = {
  accountId: string;
  accountLabel: string;
  tenantId?: string;
  emailAddress?: string;
};

export type ProviderTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
};

export type ProviderConnectionDetails = {
  identity: ProviderConnectionIdentity;
  resources: DiscoveredIntegrationResource[];
  scopes: string[];
  tokenSet: ProviderTokenSet;
};

export type ConnectionHealthResult = {
  status: IntegrationConnectionStatus;
  checkedAt: Date;
  lastError?: string;
  identity?: ProviderConnectionIdentity;
  resources?: DiscoveredIntegrationResource[];
  tokenSet?: ProviderTokenSet;
};

export type WorkflowChannelMode = "department_mailbox" | "calendar_backed" | "manual_fallback";

export type WorkflowChannelSummary = {
  mode: WorkflowChannelMode;
  label: string;
  description: string;
  provider?: IntegrationProvider;
  accountLabel?: string;
  resourceLabel?: string;
};

export type DepartmentWorkflowChannelState = {
  departmentId: string;
  email: WorkflowChannelSummary;
  scheduling: WorkflowChannelSummary;
};
