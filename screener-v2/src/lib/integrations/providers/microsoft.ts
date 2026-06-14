import { getIntegrationProviderDescriptor } from "@/lib/integrations/registry";
import { normalizeScopes, readJsonResponse, toFormBody } from "@/lib/integrations/providers/shared";
import type {
  ConnectionHealthResult,
  DiscoveredIntegrationResource,
  ProviderAppConfigInput,
  ProviderConnectionDetails,
  ProviderTokenSet
} from "@/lib/integrations/types";

type MicrosoftProfile = {
  id: string;
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
};

type MicrosoftCalendar = {
  id: string;
  name?: string;
  isDefaultCalendar?: boolean;
};

type MicrosoftCalendarsResponse = {
  value?: MicrosoftCalendar[];
};

type MicrosoftTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

function getTenantId(config: ProviderAppConfigInput) {
  return config.tenantId?.trim() || "common";
}

export function buildMicrosoftAuthorizationUrl(input: {
  config: ProviderAppConfigInput;
  redirectUri: string;
  state: string;
}) {
  const descriptor = getIntegrationProviderDescriptor("microsoft");
  const scopes = normalizeScopes(input.config.scopes, descriptor.defaultScopes);
  const url = new URL(`https://login.microsoftonline.com/${getTenantId(input.config)}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", input.config.clientId?.trim() || "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", input.state);
  return url.toString();
}

async function exchangeToken(form: URLSearchParams, config: ProviderAppConfigInput): Promise<ProviderTokenSet> {
  const response = await fetch(`https://login.microsoftonline.com/${getTenantId(config)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });
  const payload = await readJsonResponse<MicrosoftTokenResponse>(response, "Microsoft token exchange failed");
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : undefined,
    scopes: payload.scope?.split(" ").filter(Boolean) ?? []
  };
}

export async function exchangeMicrosoftAuthorizationCode(input: {
  config: ProviderAppConfigInput;
  redirectUri: string;
  code: string;
}) {
  return exchangeToken(
    toFormBody({
      client_id: input.config.clientId?.trim() || "",
      client_secret: input.config.clientSecret?.trim() || "",
      code: input.code,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    }),
    input.config
  );
}

export async function refreshMicrosoftToken(input: {
  config: ProviderAppConfigInput;
  refreshToken: string;
}) {
  return exchangeToken(
    toFormBody({
      client_id: input.config.clientId?.trim() || "",
      client_secret: input.config.clientSecret?.trim() || "",
      refresh_token: input.refreshToken,
      grant_type: "refresh_token"
    }),
    input.config
  );
}

export async function loadMicrosoftConnectionDetails(input: {
  config: ProviderAppConfigInput;
  tokenSet: ProviderTokenSet;
}): Promise<ProviderConnectionDetails> {
  const headers = { Authorization: `Bearer ${input.tokenSet.accessToken}` };
  const [profileResponse, calendarsResponse] = await Promise.all([
    fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName", { headers }),
    fetch("https://graph.microsoft.com/v1.0/me/calendars?$select=id,name,isDefaultCalendar", { headers })
  ]);

  const profile = await readJsonResponse<MicrosoftProfile>(profileResponse, "Microsoft profile lookup failed");
  const calendars = await readJsonResponse<MicrosoftCalendarsResponse>(
    calendarsResponse,
    "Microsoft calendar discovery failed"
  );

  const accountEmail = profile.mail || profile.userPrincipalName || undefined;
  const accountLabel = profile.displayName || accountEmail || "Microsoft account";

  const resources: DiscoveredIntegrationResource[] = [
    {
      resourceType: "send_mailbox",
      externalResourceId: profile.id,
      displayLabel: accountEmail ? `${accountLabel} (${accountEmail})` : accountLabel,
      emailAddress: accountEmail,
      suggestedDefault: true
    },
    {
      resourceType: "reply_mailbox",
      externalResourceId: profile.id,
      displayLabel: accountEmail ? `${accountLabel} (${accountEmail})` : accountLabel,
      emailAddress: accountEmail,
      suggestedDefault: true
    },
    {
      resourceType: "meeting_host",
      externalResourceId: profile.id,
      displayLabel: accountEmail ? `${accountLabel} (${accountEmail})` : accountLabel,
      emailAddress: accountEmail,
      suggestedDefault: true
    },
    ...(calendars.value ?? []).map((calendar) => ({
      resourceType: "calendar" as const,
      externalResourceId: calendar.id,
      displayLabel: calendar.name || "Calendar",
      suggestedDefault: Boolean(calendar.isDefaultCalendar),
      metadata: { isDefaultCalendar: Boolean(calendar.isDefaultCalendar) }
    }))
  ];

  return {
    identity: {
      accountId: profile.id,
      accountLabel,
      tenantId: input.config.tenantId?.trim() || undefined,
      emailAddress: accountEmail
    },
    resources,
    scopes: input.tokenSet.scopes ?? [],
    tokenSet: input.tokenSet
  };
}

export async function runMicrosoftHealthCheck(input: {
  config: ProviderAppConfigInput;
  tokenSet: ProviderTokenSet;
}): Promise<ConnectionHealthResult> {
  try {
    const details = await loadMicrosoftConnectionDetails(input);
    return {
      status: "connected",
      checkedAt: new Date(),
      identity: details.identity,
      resources: details.resources,
      tokenSet: details.tokenSet
    };
  } catch (error) {
    return {
      status: "sync_issue",
      checkedAt: new Date(),
      lastError: error instanceof Error ? error.message : "Microsoft health check failed."
    };
  }
}
