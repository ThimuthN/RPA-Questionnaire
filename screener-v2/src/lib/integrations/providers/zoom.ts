import { Buffer } from "buffer";
import { readJsonResponse, toFormBody } from "@/lib/integrations/providers/shared";
import type {
  ConnectionHealthResult,
  ProviderAppConfigInput,
  ProviderConnectionDetails,
  ProviderTokenSet
} from "@/lib/integrations/types";

type ZoomUser = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type ZoomTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

function zoomBasicAuth(config: ProviderAppConfigInput) {
  return `Basic ${Buffer.from(`${config.clientId?.trim() || ""}:${config.clientSecret?.trim() || ""}`).toString("base64")}`;
}

export function buildZoomAuthorizationUrl(input: {
  config: ProviderAppConfigInput;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://zoom.us/oauth/authorize");
  url.searchParams.set("client_id", input.config.clientId?.trim() || "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  return url.toString();
}

async function exchangeToken(form: URLSearchParams, config: ProviderAppConfigInput): Promise<ProviderTokenSet> {
  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: zoomBasicAuth(config),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const payload = await readJsonResponse<ZoomTokenResponse>(response, "Zoom token exchange failed");
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : undefined,
    scopes: payload.scope?.split(" ").filter(Boolean) ?? []
  };
}

export async function exchangeZoomAuthorizationCode(input: {
  config: ProviderAppConfigInput;
  redirectUri: string;
  code: string;
}) {
  return exchangeToken(
    toFormBody({
      code: input.code,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    }),
    input.config
  );
}

export async function refreshZoomToken(input: {
  config: ProviderAppConfigInput;
  refreshToken: string;
}) {
  return exchangeToken(
    toFormBody({
      refresh_token: input.refreshToken,
      grant_type: "refresh_token"
    }),
    input.config
  );
}

export async function loadZoomConnectionDetails(input: {
  tokenSet: ProviderTokenSet;
}): Promise<ProviderConnectionDetails> {
  const response = await fetch("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${input.tokenSet.accessToken}` }
  });
  const user = await readJsonResponse<ZoomUser>(response, "Zoom account lookup failed");

  const accountEmail = user.email;
  const accountLabel = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || accountEmail || "Zoom host";

  return {
    identity: {
      accountId: user.id,
      accountLabel,
      emailAddress: accountEmail
    },
    resources: [
      {
        resourceType: "meeting_host",
        externalResourceId: user.id,
        displayLabel: accountEmail ? `${accountLabel} (${accountEmail})` : accountLabel,
        emailAddress: accountEmail,
        suggestedDefault: true
      }
    ],
    scopes: input.tokenSet.scopes ?? [],
    tokenSet: input.tokenSet
  };
}

export async function runZoomHealthCheck(input: {
  tokenSet: ProviderTokenSet;
}): Promise<ConnectionHealthResult> {
  try {
    const details = await loadZoomConnectionDetails(input);
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
      lastError: error instanceof Error ? error.message : "Zoom health check failed."
    };
  }
}
