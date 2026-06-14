import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SystemIntegrationsClient } from "./SystemIntegrationsClient";
import type { ProviderAppSummary } from "@/lib/integrations";

describe("SystemIntegrationsClient", () => {
  it("renders explicit scope input guidance for provider app setup", () => {
    const providers: ProviderAppSummary[] = [
      {
        provider: "microsoft",
        label: "Microsoft 365",
        description: "Use Outlook mailboxes, Outlook calendars, and Microsoft Teams-backed scheduling.",
        capabilities: ["mail", "calendar", "meetings"],
        authType: "oauth",
        redirectUri: "https://example.com/api/integrations/oauth/microsoft/callback",
        documentationLabel: "Outlook, Calendar, Teams",
        enabled: true,
        isConfigured: false,
        clientId: "",
        tenantId: "",
        scopes: [],
        recommendedScopes: ["offline_access", "openid", "User.Read", "Mail.Send"],
        secretConfigured: false,
        lastHealthStatus: "not_configured"
      }
    ];

    const markup = renderToStaticMarkup(<SystemIntegrationsClient initialProviders={providers} />);

    expect(markup).toContain("Scopes (one per line)");
    expect(markup).toContain("Use recommended scopes");
    expect(markup).toContain("Expected input");
    expect(markup).toContain("Enter one OAuth scope value per line");
    expect(markup).toContain("offline_access");
    expect(markup).toContain("User.Read");
    expect(markup).toContain("Azure / Entra tenant GUID");
    expect(markup).toContain("Add this exact callback URL to the provider app registration.");
    expect(markup).toContain("Validate setup");
    expect(markup).toContain("It does not prove department OAuth consent, mailbox access, or calendar access until a department connects.");
  });
});
