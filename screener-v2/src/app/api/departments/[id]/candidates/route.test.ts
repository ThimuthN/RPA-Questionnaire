import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/candidacies", () => ({
  listCandidaciesForDepartment: vi.fn()
}));

const { requireApiSession, requirePermissionForDepartment } = await import("@/lib/auth/guards");
const { listCandidaciesForDepartment } = await import("@/lib/db/candidacies");

describe("GET /api/departments/[id]/candidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if session is missing", async () => {
    vi.mocked(requireApiSession).mockResolvedValueOnce({
      ok: false,
      response: { status: 401 } as any
    });

    const request = new Request("http://localhost/api/departments/dept-1/candidates");
    const result = await GET(request, { params: Promise.resolve({ id: "dept-1" }) });

    expect(result.status).toBe(401);
  });

  it("returns 403 if user lacks scoped view_candidates permission", async () => {
    vi.mocked(requireApiSession).mockResolvedValueOnce({
      ok: true,
      session: { userId: "user-1", departmentId: "dept-2", permissions: [] }
    });

    vi.mocked(requirePermissionForDepartment).mockResolvedValueOnce({
      ok: false,
      response: { status: 403 } as any
    });

    const request = new Request("http://localhost/api/departments/dept-1/candidates");
    const result = await GET(request, { params: Promise.resolve({ id: "dept-1" }) });

    expect(result.status).toBe(403);
    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(
      expect.any(Object),
      "view_candidates",
      "dept-1"
    );
  });

  it("allows access with global view_candidates permission", async () => {
    vi.mocked(requireApiSession).mockResolvedValueOnce({
      ok: true,
      session: { userId: "user-1", departmentId: "dept-1", permissions: ["view_candidates"] }
    });

    vi.mocked(requirePermissionForDepartment).mockResolvedValueOnce({
      ok: true
    });

    vi.mocked(listCandidaciesForDepartment).mockResolvedValueOnce({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 12
    } as any);

    const request = new Request("http://localhost/api/departments/dept-1/candidates");
    const result = await GET(request, { params: Promise.resolve({ id: "dept-1" }) });

    expect(result.status).toBe(200);
    expect(vi.mocked(listCandidaciesForDepartment)).toHaveBeenCalledWith({
      departmentId: "dept-1",
      page: 1,
      pageSize: 12
    });
  });

  it("sanitizes error messages in 500 catch", async () => {
    vi.mocked(requireApiSession).mockResolvedValueOnce({
      ok: true,
      session: { userId: "user-1", permissions: ["view_candidates"] }
    });

    vi.mocked(requirePermissionForDepartment).mockResolvedValueOnce({
      ok: true
    });

    vi.mocked(listCandidaciesForDepartment).mockRejectedValueOnce(
      new Error("Database connection failed")
    );

    const request = new Request("http://localhost/api/departments/dept-1/candidates");
    const result = await GET(request, { params: Promise.resolve({ id: "dept-1" }) });

    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.error).toBe("Failed to fetch candidacies");
    expect(body.error).not.toContain("Database");
  });
});
