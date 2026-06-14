import { describe, it, expect, vi, beforeEach } from "vitest";

// redirect() from next/navigation throws a special internal error that Next.js
// intercepts. In tests, mock it as a no-op so we can inspect calls without
// triggering the route's catch block.
vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("@/lib/integrations/http", () => ({
  parseIntegrationProvider: vi.fn(),
  callbackQuerySchema: {
    parse: vi.fn()
  }
}));

vi.mock("@/lib/integrations/oauth-state", () => ({
  peekIntegrationOauthState: vi.fn()
}));

vi.mock("@/lib/integrations/service", () => ({
  completeDepartmentProviderConnection: vi.fn()
}));

import { GET } from "./route";
import { parseIntegrationProvider, callbackQuerySchema } from "@/lib/integrations/http";
import { peekIntegrationOauthState } from "@/lib/integrations/oauth-state";
import { completeDepartmentProviderConnection } from "@/lib/integrations/service";
import { redirect } from "next/navigation";

function makeRequest(provider: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ state: "state-token-123", code: "auth-code-abc", ...params });
  return new Request(`http://localhost/api/integrations/oauth/${provider}/callback?${qs.toString()}`);
}

describe("GET /api/integrations/oauth/[provider]/callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to department access page with integrationUpdated param on success", async () => {
    vi.mocked(parseIntegrationProvider).mockReturnValue("microsoft" as any);
    vi.mocked(callbackQuerySchema.parse).mockReturnValue({ state: "tok", code: "code-1", error: undefined } as any);
    vi.mocked(completeDepartmentProviderConnection).mockResolvedValue({ departmentId: "dept-1" } as any);

    await GET(makeRequest("microsoft"), { params: Promise.resolve({ provider: "microsoft" }) });

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      expect.stringContaining("/departments/dept-1/access")
    );
    const url = vi.mocked(redirect).mock.calls[0][0] as string;
    expect(url).toContain("integrationUpdated=microsoft");
  });

  it("redirects with provider error when OAuth returns error param", async () => {
    vi.mocked(parseIntegrationProvider).mockReturnValue("microsoft" as any);
    vi.mocked(callbackQuerySchema.parse).mockReturnValue({
      state: "tok",
      error: "access_denied",
      error_description: "User cancelled"
    } as any);
    vi.mocked(peekIntegrationOauthState).mockResolvedValue({ departmentId: "dept-1" } as any);

    await GET(makeRequest("microsoft", { error: "access_denied" }), { params: Promise.resolve({ provider: "microsoft" }) });

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      expect.stringContaining("/departments/dept-1/access")
    );
    const url = vi.mocked(redirect).mock.calls[0][0] as string;
    const errorParam = new URL(url, "http://localhost").searchParams.get("error") ?? "";
    expect(errorParam).toContain("access_denied");
  });

  it("redirects to /departments with error on invalid provider (ZodError)", async () => {
    const { z } = await import("zod");
    vi.mocked(parseIntegrationProvider).mockImplementation(() => {
      throw new z.ZodError([{ code: "custom", message: "Invalid provider", path: [] }]);
    });

    await GET(makeRequest("invalid_provider"), { params: Promise.resolve({ provider: "invalid_provider" }) });

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      expect.stringContaining("/departments")
    );
    const url = vi.mocked(redirect).mock.calls[0][0] as string;
    expect(url).toContain("error=");
  });

  it("redirects to department access with error when token exchange fails", async () => {
    vi.mocked(parseIntegrationProvider).mockReturnValue("google" as any);
    vi.mocked(callbackQuerySchema.parse).mockReturnValue({ state: "tok", code: "bad-code", error: undefined } as any);
    vi.mocked(completeDepartmentProviderConnection).mockRejectedValue(new Error("Token exchange failed"));
    vi.mocked(peekIntegrationOauthState).mockResolvedValue({ departmentId: "dept-2" } as any);

    await GET(makeRequest("google"), { params: Promise.resolve({ provider: "google" }) });

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      expect.stringContaining("/departments/dept-2/access")
    );
    const url = vi.mocked(redirect).mock.calls[0][0] as string;
    const errorParam = new URL(url, "http://localhost").searchParams.get("error") ?? "";
    expect(errorParam).toContain("Token exchange failed");
  });
});
