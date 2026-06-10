import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/jobs", () => ({
  createJobPosting: vi.fn(),
  validateJobPostingWorkspaceSelection: vi.fn()
}));

vi.mock("@/lib/jobs/rich-text", () => ({
  sanitizeJobDescriptionHtml: vi.fn((v: string) => v),
  jobDescriptionTextContent: vi.fn((v: string) => v)
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createJobPosting, validateJobPostingWorkspaceSelection } from "@/lib/db/jobs";

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

function makeJobRequest(overrides: Record<string, string> = {}) {
  const params = new URLSearchParams({
    title: "Software Engineer",
    roleId: "role-1",
    summary: "Build great things",
    description: "We are looking for a talented engineer to join our team.",
    ...overrides
  });
  return makeRequest(params.toString());
}

function errorFromLocation(location: string | null): string | null {
  if (!location) return null;
  return new URL(location, "http://localhost").searchParams.get("error");
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
    vi.mocked(validateJobPostingWorkspaceSelection).mockResolvedValue({
      roleDepartmentId: "dept-1",
      presetDepartmentId: null
    } as never);
  });

  it("calls requirePermissionForDepartment for create_job", async () => {
    await POST(makeRequest());
    expect(requirePermissionForDepartment).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      "create_job",
      "dept-1"
    );
  });

  it("validates workspace-aware role and preset selection before create", async () => {
    await POST(makeJobRequest({ departmentId: "dept-1", screenerPresetId: "preset-1" }));

    expect(validateJobPostingWorkspaceSelection).toHaveBeenCalledWith({
      roleId: "role-1",
      departmentId: "dept-1",
      screenerPresetId: "preset-1"
    });
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

describe("/api/jobs POST salary validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-1", permissions: ["create_job"] }
    } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(createJobPosting).mockResolvedValue({ id: "job-1" } as never);
    vi.mocked(validateJobPostingWorkspaceSelection).mockResolvedValue({
      roleDepartmentId: "dept-1",
      presetDepartmentId: null
    } as never);
  });

  it("accepts valid salary fields and creates the job", async () => {
    const response = await POST(makeJobRequest({ salaryMin: "100000", salaryMax: "150000" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("created=1");
    expect(createJobPosting).toHaveBeenCalledWith(
      expect.objectContaining({ salaryMin: 100000, salaryMax: 150000 })
    );
  });

  it("accepts empty salary fields (optional)", async () => {
    const response = await POST(makeJobRequest({ salaryMin: "", salaryMax: "" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("created=1");
    expect(createJobPosting).toHaveBeenCalledWith(
      expect.objectContaining({ salaryMin: undefined, salaryMax: undefined })
    );
  });

  it("accepts only salaryMin without salaryMax", async () => {
    const response = await POST(makeJobRequest({ salaryMin: "90000" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("created=1");
  });

  it("rejects oversized salary before DB write with a clean message", async () => {
    const response = await POST(makeJobRequest({ salaryMin: "123123123213" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Salary is too large.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });

  it("rejects negative salary with a clean message", async () => {
    const response = await POST(makeJobRequest({ salaryMax: "-5000" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Salary cannot be negative.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });

  it("rejects a decimal salary with a clean message", async () => {
    const response = await POST(makeJobRequest({ salaryMin: "1000.50" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Salary must be a whole number.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });

  it("rejects min salary greater than max salary with a clean message", async () => {
    const response = await POST(makeJobRequest({ salaryMin: "200000", salaryMax: "100000" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Minimum salary cannot be greater than maximum salary.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });

  it("accepts salaryMin equal to salaryMax", async () => {
    const response = await POST(makeJobRequest({ salaryMin: "100000", salaryMax: "100000" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("created=1");
  });
});

describe("/api/jobs POST error formatting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-1", permissions: ["create_job"] }
    } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(createJobPosting).mockResolvedValue({ id: "job-1" } as never);
    vi.mocked(validateJobPostingWorkspaceSelection).mockResolvedValue({
      roleDepartmentId: "dept-1",
      presetDepartmentId: null
    } as never);
  });

  it("returns a clean message for Zod validation failure, not a raw JSON array", async () => {
    // Title too short triggers a Zod error
    const response = await POST(makeJobRequest({ title: "x" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).not.toMatch(/^\[/);
    expect(error).toBe("Job title must be at least 2 characters.");
  });

  it("returns a clean message for missing roleId", async () => {
    const response = await POST(makeJobRequest({ roleId: "" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("A role is required.");
  });

  it("returns a safe message for Prisma errors, not raw stack traces", async () => {
    class PrismaClientKnownRequestError extends Error {
      code = "P2006";
      constructor() {
        super("Invalid `prisma.jobPosting.create()` invocation:\n  ...");
      }
    }
    vi.mocked(createJobPosting).mockRejectedValue(new PrismaClientKnownRequestError());

    const response = await POST(makeJobRequest());
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Could not save the job. Please try again.");
    expect(error).not.toContain("prisma");
    expect(error).not.toContain("invocation");
  });

  it("returns JSON error when Accept: application/json and Zod fails", async () => {
    const request = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({ title: "x", roleId: "r", summary: "short", description: "short desc for testing" }).toString()
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(typeof body.message).toBe("string");
    expect(body.message).not.toMatch(/^\[/);
  });

  it("does not leak the message of an unknown internal Error", async () => {
    vi.mocked(createJobPosting).mockRejectedValue(new Error("internal DB pool exhausted at node:net:1234"));

    const response = await POST(makeJobRequest());
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Could not create job.");
    expect(error).not.toContain("pool");
    expect(error).not.toContain("node:");
  });
});

describe("/api/jobs POST teamSize validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-1", permissions: ["create_job"] }
    } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(createJobPosting).mockResolvedValue({ id: "job-1" } as never);
    vi.mocked(validateJobPostingWorkspaceSelection).mockResolvedValue({
      roleDepartmentId: "dept-1",
      presetDepartmentId: null
    } as never);
  });

  it("accepts empty teamSize", async () => {
    const response = await POST(makeJobRequest({ teamSize: "" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("created=1");
    expect(createJobPosting).toHaveBeenCalledWith(
      expect.objectContaining({ teamSize: undefined })
    );
  });

  it("accepts teamSize 1", async () => {
    const response = await POST(makeJobRequest({ teamSize: "1" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("created=1");
    expect(createJobPosting).toHaveBeenCalledWith(
      expect.objectContaining({ teamSize: 1 })
    );
  });

  it("accepts teamSize 500", async () => {
    const response = await POST(makeJobRequest({ teamSize: "500" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("created=1");
    expect(createJobPosting).toHaveBeenCalledWith(
      expect.objectContaining({ teamSize: 500 })
    );
  });

  it("rejects teamSize 0 with a clean message", async () => {
    const response = await POST(makeJobRequest({ teamSize: "0" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Team size must be at least 1.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });

  it("rejects negative teamSize with a clean message", async () => {
    const response = await POST(makeJobRequest({ teamSize: "-1" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Team size must be at least 1.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });

  it("rejects decimal teamSize with a clean message", async () => {
    const response = await POST(makeJobRequest({ teamSize: "4.5" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Team size must be a whole number.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });

  it("rejects huge teamSize before Prisma with a clean message", async () => {
    const response = await POST(makeJobRequest({ teamSize: "999999999999" }));
    expect(response.status).toBe(303);
    const error = errorFromLocation(response.headers.get("location"));
    expect(error).toBe("Team size is too large.");
    expect(createJobPosting).not.toHaveBeenCalled();
  });
});
