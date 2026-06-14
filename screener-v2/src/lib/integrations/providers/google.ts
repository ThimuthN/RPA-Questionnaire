import { getIntegrationProviderDescriptor } from "@/lib/integrations/registry";
import { normalizeScopes, readJsonResponse, toFormBody } from "@/lib/integrations/providers/shared";
import type {
  ConnectionHealthResult,
  DiscoveredIntegrationResource,
  ProviderAppConfigInput,
  ProviderConnectionDetails,
  ProviderTokenSet
} from "@/lib/integrations/types";

type GoogleUserInfo = {
  id: string;
  email?: string;
  name?: string;
};

type GoogleCalendarList = {
  items?: Array<{
    id: string;
    summary?: string;
    primary?: boolean;
  }>;
};

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

export function buildGoogleAuthorizationUrl(input: {
  config: ProviderAppConfigInput;
  redirectUri: string;
  state: string;
}) {
  const descriptor = getIntegrationProviderDescriptor("google");
  const scopes = normalizeScopes(input.config.scopes, descriptor.defaultScopes);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.config.clientId?.trim() || "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", input.state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  return url.toString();
}

async function exchangeToken(form: URLSearchParams): Promise<ProviderTokenSet> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });
  const payload = await readJsonResponse<GoogleTokenResponse>(response, "Google token exchange failed");
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : undefined,
    scopes: payload.scope?.split(" ").filter(Boolean) ?? []
  };
}

export async function exchangeGoogleAuthorizationCode(input: {
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
    })
  );
}

export async function refreshGoogleToken(input: {
  config: ProviderAppConfigInput;
  refreshToken: string;
}) {
  return exchangeToken(
    toFormBody({
      client_id: input.config.clientId?.trim() || "",
      client_secret: input.config.clientSecret?.trim() || "",
      refresh_token: input.refreshToken,
      grant_type: "refresh_token"
    })
  );
}

export async function loadGoogleConnectionDetails(input: {
  tokenSet: ProviderTokenSet;
}): Promise<ProviderConnectionDetails> {
  const headers = { Authorization: `Bearer ${input.tokenSet.accessToken}` };
  const [userResponse, calendarsResponse] = await Promise.all([
    fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers }),
    fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers })
  ]);

  const user = await readJsonResponse<GoogleUserInfo>(userResponse, "Google account lookup failed");
  const calendars = await readJsonResponse<GoogleCalendarList>(calendarsResponse, "Google calendar discovery failed");

  const accountEmail = user.email;
  const accountLabel = user.name || accountEmail || "Google Workspace account";

  const resources: DiscoveredIntegrationResource[] = [
    {
      resourceType: "send_mailbox",
      externalResourceId: user.id,
      displayLabel: accountEmail ? `${accountLabel} (${accountEmail})` : accountLabel,
      emailAddress: accountEmail,
      suggestedDefault: true
    },
    {
      resourceType: "reply_mailbox",
      externalResourceId: user.id,
      displayLabel: accountEmail ? `${accountLabel} (${accountEmail})` : accountLabel,
      emailAddress: accountEmail,
      suggestedDefault: true
    },
    {
      resourceType: "meeting_host",
      externalResourceId: user.id,
      displayLabel: accountEmail ? `${accountLabel} (${accountEmail})` : accountLabel,
      emailAddress: accountEmail,
      suggestedDefault: true
    },
    ...((calendars.items ?? []).map((calendar) => ({
      resourceType: "calendar" as const,
      externalResourceId: calendar.id,
      displayLabel: calendar.summary || "Calendar",
      suggestedDefault: Boolean(calendar.primary),
      metadata: { primary: Boolean(calendar.primary) }
    })))
  ];

  return {
    identity: {
      accountId: user.id,
      accountLabel,
      emailAddress: accountEmail
    },
    resources,
    scopes: input.tokenSet.scopes ?? [],
    tokenSet: input.tokenSet
  };
}

export async function runGoogleHealthCheck(input: {
  tokenSet: ProviderTokenSet;
}): Promise<ConnectionHealthResult> {
  try {
    const details = await loadGoogleConnectionDetails(input);
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
      lastError: error instanceof Error ? error.message : "Google health check failed."
    };
  }
}
