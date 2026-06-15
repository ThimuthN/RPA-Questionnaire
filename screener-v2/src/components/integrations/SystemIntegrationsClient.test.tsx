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

    // label shortened; "Expected input" block removed; help text moved to InfoTooltip
    expect(markup).toContain("Scopes");
    expect(markup).toContain("Use recommended");
    expect(markup).toContain("Azure / Entra tenant GUID");
    // Redirect URI still shown, instruction moved to tooltip content
    expect(markup).toContain("Redirect URI");
    expect(markup).toContain("Validate setup");
    // Setup check guidance is now in a tooltip on the button
    expect(markup).toContain("Does not verify department OAuth consent or mailbox/calendar access");
  });
});
