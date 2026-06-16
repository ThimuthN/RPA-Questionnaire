import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { AuditLogClient } from "./AuditLogClient";
import type { AuditLogEntry } from "./AuditLogClient";

vi.mock("lucide-react", () => ({
  Search: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  RefreshCw: () => null,
}));

const makeEntry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id: "log-1",
  action: "user_login",
  actorEmail: "actor@example.com",
  targetId: "user-1",
  targetType: "user",
  after: null,
  ipAddress: "192.168.1.1",
  createdAt: "2026-06-01T10:30:00.000Z",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuditLogClient", () => {
  describe("table rendering", () => {
    it("renders log entries in the table", () => {
      const logs = [
        makeEntry({ id: "log-1", actorEmail: "alice@example.com", action: "user_login" }),
        makeEntry({ id: "log-2", actorEmail: "bob@example.com", action: "user_logout" }),
      ];

      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={logs} initialTotal={2} initialPages={1} />
      );

      expect(markup).toContain("alice@example.com");
      expect(markup).toContain("bob@example.com");
    });

    it("shows 'No events found.' when logs array is empty", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[]} initialTotal={0} initialPages={0} />
      );

      expect(markup).toContain("No events found.");
    });

    it("does not show 'No events found.' when logs are present", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[makeEntry()]} initialTotal={1} initialPages={1} />
      );

      expect(markup).not.toContain("No events found.");
    });

    it("renders table column headers", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[]} initialTotal={0} initialPages={0} />
      );

      expect(markup).toContain("Time");
      expect(markup).toContain("Event");
      expect(markup).toContain("Actor");
      expect(markup).toContain("Details");
      expect(markup).toContain("IP");
    });
  });

  describe("action label formatting", () => {
    it("formats user_login as 'Login'", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ action: "user_login" })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      expect(markup).toContain("Login");
    });

    it("formats user_login_failed as 'Login failed'", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ action: "user_login_failed" })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      expect(markup).toContain("Login failed");
    });

    it("formats user_logout as 'Logout'", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ action: "user_logout" })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      expect(markup).toContain("Logout");
    });

    it("formats user_mfa_enabled as 'MFA enabled'", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ action: "user_mfa_enabled" })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      expect(markup).toContain("MFA enabled");
    });

    it("formats security_settings_updated as 'Security settings updated'", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ action: "security_settings_updated" })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      expect(markup).toContain("Security settings updated");
    });

    it("falls back to title-cased snake_case for unknown action keys", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ action: "custom_unknown_event" })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      // Fallback: underscores replaced with spaces, title-cased
      expect(markup).toContain("Custom Unknown Event");
    });
  });

  describe("IP address display", () => {
    it("shows the IP address when present", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ ipAddress: "10.0.0.1" })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      expect(markup).toContain("10.0.0.1");
    });

    it("shows em dash when ipAddress is null", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient
          initialLogs={[makeEntry({ ipAddress: null })]}
          initialTotal={1}
          initialPages={1}
        />
      );

      // The component renders "—" for null ipAddress
      expect(markup).toContain("—");
    });
  });

  describe("pagination", () => {
    it("shows pagination controls when pages > 1", () => {
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeEntry({ id: `log-${i}`, actorEmail: `user${i}@example.com` })
      );

      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={logs} initialTotal={150} initialPages={3} />
      );

      // Pagination shows "page / total" format
      expect(markup).toContain("1 / 3");
      // Total count is shown
      expect(markup).toContain("150 events");
    });

    it("hides pagination when pages <= 1", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[makeEntry()]} initialTotal={1} initialPages={1} />
      );

      // Pagination block only renders when pages > 1; page/total separator not present
      expect(markup).not.toContain("1 / 1");
    });

    it("hides pagination when pages is 0 (empty results)", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[]} initialTotal={0} initialPages={0} />
      );

      expect(markup).not.toContain("0 / 0");
    });

    it("uses singular 'event' for a total of 1", () => {
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeEntry({ id: `log-${i}` })
      );

      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={logs} initialTotal={1} initialPages={2} />
      );

      expect(markup).toContain("1 event");
      expect(markup).not.toContain("1 events");
    });

    it("uses plural 'events' for totals other than 1", () => {
      const logs = Array.from({ length: 3 }, (_, i) =>
        makeEntry({ id: `log-${i}` })
      );

      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={logs} initialTotal={99} initialPages={2} />
      );

      expect(markup).toContain("99 events");
    });
  });

  describe("filter bar", () => {
    it("renders the actor email search input", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[]} initialTotal={0} initialPages={0} />
      );

      expect(markup).toContain("Filter by email");
      expect(markup).toContain("Search");
    });

    it("renders the action filter select with 'All events' default option", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[]} initialTotal={0} initialPages={0} />
      );

      expect(markup).toContain("All events");
    });

    it("renders the Refresh button", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[]} initialTotal={0} initialPages={0} />
      );

      expect(markup).toContain("Refresh");
    });

    it("includes all known action types in the filter dropdown", () => {
      const markup = renderToStaticMarkup(
        <AuditLogClient initialLogs={[]} initialTotal={0} initialPages={0} />
      );

      expect(markup).toContain("Login failed");
      expect(markup).toContain("MFA enabled");
      expect(markup).toContain("Device trusted");
      expect(markup).toContain("Invite accepted");
    });
  });
});
