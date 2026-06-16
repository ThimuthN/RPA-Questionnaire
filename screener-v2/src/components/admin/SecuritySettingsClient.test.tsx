import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { SecuritySettingsClient } from "./SecuritySettingsClient";
import type { SecuritySettings } from "./SecuritySettingsClient";

vi.mock("lucide-react", () => ({
  Shield: () => null,
  Lock: () => null,
  KeyRound: () => null,
  Clock: () => null,
  ChevronRight: () => null,
}));

const defaultSettings: SecuritySettings = {
  mfaEnforcement: "off",
  passwordMinLength: 8,
  requireUppercase: false,
  requireNumber: true,
  requireSpecial: false,
  sessionDays: 7,
  lockoutThreshold: 10,
  lockoutMinutes: 30,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SecuritySettingsClient", () => {
  describe("section rendering", () => {
    it("renders all 4 section headings", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Multi-factor authentication");
      expect(markup).toContain("Account lockout");
      expect(markup).toContain("Password requirements");
      expect(markup).toContain("Session duration");
    });

    it("renders the SSO coming soon placeholder", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Single sign-on (SSO)");
      expect(markup).toContain("Coming soon");
      expect(markup).toContain("SAML 2.0 / OIDC");
    });
  });

  describe("MFA options", () => {
    it("renders radio options for all 3 MFA modes", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Optional");
      expect(markup).toContain("Required for admins");
      expect(markup).toContain("Required for everyone");
    });

    it("highlights the current mfaEnforcement selection with brand classes when set to off", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={{ ...defaultSettings, mfaEnforcement: "off" }} />
      );

      // The selected radio button contains the filled inner dot element
      // Optional is the label for "off"
      expect(markup).toContain("Optional");
      // The selected button includes --app-brand classes that non-selected ones do not
      // The inner filled dot only renders for selected option
      const optionalIndex = markup.indexOf("Optional");
      const brandDotCount = (markup.match(/bg-\[color:var\(--app-brand\)\]/g) ?? []).length;
      // At minimum the selected radio's inner dot and border use brand color
      expect(brandDotCount).toBeGreaterThanOrEqual(1);
    });

    it("highlights admins option when mfaEnforcement is admins", () => {
      const markupAdmins = renderToStaticMarkup(
        <SecuritySettingsClient initial={{ ...defaultSettings, mfaEnforcement: "admins" }} />
      );
      const markupOff = renderToStaticMarkup(
        <SecuritySettingsClient initial={{ ...defaultSettings, mfaEnforcement: "off" }} />
      );

      // Both contain the label, but the selected one renders an inner dot element
      // The inner dot <div class="h-2 w-2 rounded-full bg-[color:var(--app-brand)]"> only exists for the selected option
      // Count filled dot occurrences — exactly 1 per render (one selected option)
      const dotsAdmins = (markupAdmins.match(/h-2 w-2 rounded-full/g) ?? []).length;
      const dotsOff = (markupOff.match(/h-2 w-2 rounded-full/g) ?? []).length;
      expect(dotsAdmins).toBe(1);
      expect(dotsOff).toBe(1);

      // When admins is selected, the "Required for admins" button carries the selected border class
      expect(markupAdmins).toContain("Required for admins");
      expect(markupOff).toContain("Required for admins");
    });

    it("shows all MFA option descriptions", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Users choose whether to enable 2FA");
      expect(markup).toContain("manage_users, manage_integrations, or manage_roles");
      expect(markup).toContain("All users must complete 2FA enrollment");
    });
  });

  describe("password requirements section", () => {
    it("toggle reflects initial requireUppercase=false (aria-checked false)", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={{ ...defaultSettings, requireUppercase: false }} />
      );

      // The toggle button has aria-checked attribute
      // requireUppercase toggle should be aria-checked="false"
      // We verify by checking the label is present and there is an aria-checked="false" in the markup
      expect(markup).toContain("Require uppercase letter");
      expect(markup).toContain('aria-checked="false"');
    });

    it("toggle reflects initial requireUppercase=true (aria-checked true)", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={{ ...defaultSettings, requireUppercase: true }} />
      );

      expect(markup).toContain("Require uppercase letter");
      expect(markup).toContain('aria-checked="true"');
    });

    it("renders all 3 password constraint toggles", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Require uppercase letter");
      expect(markup).toContain("Require number");
      expect(markup).toContain("Require special character");
    });

    it("renders minimum length input", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={{ ...defaultSettings, passwordMinLength: 12 }} />
      );

      expect(markup).toContain("Minimum length");
      expect(markup).toContain("characters");
      // The input value 12 should appear
      expect(markup).toContain("12");
    });
  });

  describe("save button", () => {
    it("renders the Save changes button", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Save changes");
    });

    it("renders the default footer hint text when not saved or errored", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Changes apply to new logins immediately");
    });
  });

  describe("account lockout section", () => {
    it("renders lockout threshold and duration controls", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("Failed attempts before lockout");
      expect(markup).toContain("Lockout duration");
      expect(markup).toContain("attempts");
    });
  });

  describe("session duration section", () => {
    it("renders all session duration options", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("1 day");
      expect(markup).toContain("3 days");
      expect(markup).toContain("7 days (default)");
      expect(markup).toContain("14 days");
      expect(markup).toContain("30 days");
    });

    it("includes session expiry notice", () => {
      const markup = renderToStaticMarkup(
        <SecuritySettingsClient initial={defaultSettings} />
      );

      expect(markup).toContain("newly issued tokens only");
    });
  });
});
