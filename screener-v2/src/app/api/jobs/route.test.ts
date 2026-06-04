import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/jobs", () => ({
  createJobPosting: vi.fn()
}));

vi.mock("@/lib/jobs/rich-text", () => ({
  sanitizeJobDescriptionHtml: vi.fn((v: string) => v),
  jobDescriptionTextContent: vi.fn((v: string) => v)
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createJobPosting } from "@/lib/db/jobs";

const VALID_BODY = new URLSearchParams({
  title: "Software Engineer",
  roleId: "role-1",
  summary: "Build great things",
  description: "We are looking for a talented engineer to join our team.",
  returnTo: "/departments/dept-1/jobs"
}).toString();

function makeRequest(body: string = VALID_BODY) {
  return new Request("http://localhost/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
}

describe("/api/jobs POST authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-1", permissions: ["create_job"] }
    } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(createJobPosting).mockResolvedValue({ id: "job-1" } as never);
  });

  it("calls requirePermissionForDepartment for create_job", async () => {
    await POST(makeRequest());
    expect(requirePermissionForDepartment).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      "create_job"
    );
  });

  it("blocks unauthorized user with 403", async () => {
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false, message: "Permission denied: create_job" }), { status: 403 })
    } as never);

    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.ok).toBe(false);
  });

  it("redirects to returnTo path on success", async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("/departments/dept-1/jobs");
    expect(location).toContain("created=1");
  });

  it("redirects to department new page on validation error", async () => {
    vi.mocked(createJobPosting).mockRejectedValue(new Error("Designation not found"));

    const response = await POST(makeRequest());
    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("/departments/dept-1/jobs/new");
    expect(location).toContain("error=");
  });

  it("defaults to /people/candidates/jobs on success when no returnTo", async () => {
    const noReturnTo = new URLSearchParams({
      title: "Software Engineer",
      roleId: "role-1",
      summary: "Build great things",
      description: "We are looking for a talented engineer to join our team."
    }).toString();

    const response = await POST(makeRequest(noReturnTo));
    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("/people/candidates/jobs");
  });
});
