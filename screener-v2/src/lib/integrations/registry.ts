import { getAppUrl } from "@/lib/email";
import type { IntegrationProvider, IntegrationProviderDescriptor } from "@/lib/integrations/types";

export const integrationProviderRegistry: Record<IntegrationProvider, IntegrationProviderDescriptor> = {
  microsoft: {
    provider: "microsoft",
    label: "Microsoft 365",
    description: "Use Outlook mailboxes, Outlook calendars, and Microsoft Teams-backed scheduling.",
    capabilities: ["mail", "calendar", "meetings"],
    authType: "oauth",
    requiresTenantId: true,
    redirectPath: "/api/integrations/oauth/microsoft/callback",
    documentationLabel: "Outlook, Calendar, Teams",
    discoveryUrl: "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    defaultScopes: [
      "offline_access",
      "openid",
      "profile",
      "email",
      "User.Read",
      "Mail.Read",
      "Mail.Send",
      "Calendars.Read",
      "Calendars.ReadWrite"
    ]
  },
  google: {
    provider: "google",
    label: "Google Workspace",
    description: "Use Gmail, Google Calendar, and Google Meet-backed scheduling resources.",
    capabilities: ["mail", "calendar", "meetings"],
    authType: "oauth",
    redirectPath: "/api/integrations/oauth/google/callback",
    documentationLabel: "Gmail, Calendar, Meet",
    discoveryUrl: "https://accounts.google.com/.well-known/openid-configuration",
    defaultScopes: [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar"
    ]
  },
  zoom: {
    provider: "zoom",
    label: "Zoom",
    description: "Use a Zoom host account for department-managed meeting scheduling foundations.",
    capabilities: ["meetings"],
    authType: "oauth",
    redirectPath: "/api/integrations/oauth/zoom/callback",
    documentationLabel: "Zoom Meetings",
    discoveryUrl: "https://zoom.us/.well-known/openid-configuration",
    defaultScopes: ["meeting:read:meeting", "meeting:write:meeting", "user:read:user"]
  }
};

export function listIntegrationProviders() {
  return Object.values(integrationProviderRegistry);
}

export function getIntegrationProviderDescriptor(provider: IntegrationProvider) {
  return integrationProviderRegistry[provider];
}

export function getIntegrationRedirectUri(provider: IntegrationProvider) {
  const descriptor = getIntegrationProviderDescriptor(provider);
  return `${getAppUrl()}${descriptor.redirectPath}`;
}
