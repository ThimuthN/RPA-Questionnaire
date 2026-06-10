import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/jobs", () => ({
  getJobPosting: vi.fn(),
  updateJobPosting: vi.fn(),
  validateJobPostingWorkspaceSelection: vi.fn()
}));

vi.mock("@/lib/jobs/rich-text", () => ({
  sanitizeJobDescriptionHtml: vi.fn((value: string) => value),
  jobDescriptionTextContent: vi.fn((value: string) => value)
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  getJobPosting,
  updateJobPosting,
  validateJobPostingWorkspaceSelection
} from "@/lib/db/jobs";

function makeCurrentJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    slug: "rpa-engineer",
    title: "RPA Engineer",
    departmentId: "dept-1",
    roleId: "role-1",
    roleLabel: "RPA Engineer",
    roleDepartment: "Automation",
    screenerPresetId: "",
    summary: "Build automation systems",
    description: "Public description content that is definitely long enough.",
    isPublished: true,
    isOpen: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    applicantCount: 0,
    salaryMin: null,
    salaryMax: null,
    teamSize: null,
    techStack: null,
    remotePolicy: null,
    recentApplications: [],
    ...overrides
  };
}

function makeRequest(overrides: Record<string, string> = {}) {
  const body = new URLSearchParams({
    title: "RPA Engineer",
    roleId: "role-1",
    summary: "Build automation systems",
    description: "Public description content that is definitely long enough.",
    returnTo: "/departments/dept-1/jobs/job-1",
    ...overrides
  }).toString();

  return new Request("http://localhost/api/jobs/job-1", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
}

describe("/api/jobs/[id] POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-1", permissions: ["edit_job"] }
    } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(getJobPosting).mockResolvedValue(makeCurrentJob() as never);
    vi.mocked(updateJobPosting).mockResolvedValue(makeCurrentJob() as never);
    vi.mocked(validateJobPostingWorkspaceSelection).mockResolvedValue({
      roleDepartmentId: "dept-1",
      presetDepartmentId: null
    } as never);
  });

  it("checks edit permission against the job department", async () => {
    await POST(makeRequest(), { params: Promise.resolve({ id: "job-1" }) });

    expect(requirePermissionForDepartment).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      "edit_job",
      "dept-1"
    );
  });

  it("redirects save back to the workspace-specific editor path", async () => {
    const response = await POST(makeRequest(), { params: Promise.resolve({ id: "job-1" }) });

    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("/departments/dept-1/jobs/job-1");
    expect(location).toContain("updated=1");
  });

  it("validates workspace-aware role and preset selection on save", async () => {
    await POST(
      makeRequest({ departmentId: "dept-1", screenerPresetId: "preset-1" }),
      { params: Promise.resolve({ id: "job-1" }) }
    );

    expect(validateJobPostingWorkspaceSelection).toHaveBeenCalledWith({
      roleId: "role-1",
      departmentId: "dept-1",
      screenerPresetId: "preset-1"
    });
  });

  it("redirects toggle actions back to the same workspace path", async () => {
    const response = await POST(
      makeRequest({ action: "toggle_open" }),
      { params: Promise.resolve({ id: "job-1" }) }
    );

    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("/departments/dept-1/jobs/job-1");
    expect(location).toContain("updated=1");
    expect(updateJobPosting).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ isOpen: false })
    );
  });

  it("returns the permission response when department access is denied", async () => {
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false, message: "Permission denied: edit_job" }), {
        status: 403
      })
    } as never);

    const response = await POST(makeRequest(), { params: Promise.resolve({ id: "job-1" }) });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(updateJobPosting).not.toHaveBeenCalled();
  });

  it("rejects invalid salary ranges before update", async () => {
    const response = await POST(
      makeRequest({ salaryMin: "150000", salaryMax: "120000" }),
      { params: Promise.resolve({ id: "job-1" }) }
    );

    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("error=Minimum+salary+cannot+be+greater+than+maximum+salary.");
    expect(updateJobPosting).not.toHaveBeenCalled();
  });

  it("returns JSON validation errors when the editor submits via fetch", async () => {
    const request = new Request("http://localhost/api/jobs/job-1", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({
        title: "RPA Engineer",
        roleId: "role-1",
        summary: "Build automation systems",
        description: "short",
        returnTo: "/departments/dept-1/jobs/job-1"
      }).toString()
    });

    const response = await POST(request, { params: Promise.resolve({ id: "job-1" }) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.message).toBe("Description must be at least 20 characters.");
  });

  it("does not leak unexpected internal errors on update", async () => {
    vi.mocked(updateJobPosting).mockRejectedValue(new Error("socket timeout at db host 10.0.0.15"));

    const response = await POST(makeRequest(), { params: Promise.resolve({ id: "job-1" }) });

    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toContain("error=Could+not+update+job.");
    expect(location).not.toContain("socket");
  });
});
