import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermission: vi.fn(),
  requireRoleManagePermission: vi.fn()
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  isSystemAdmin: vi.fn()
}));

vi.mock("@/lib/roles/catalog", () => ({
  createRoleCatalogEntry: vi.fn(),
  getRoleCatalogEntry: vi.fn(),
  getRoleUsageCounts: vi.fn(),
  listAccessRoles: vi.fn(),
  listRoleCatalog: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    department: {
      findUnique: vi.fn()
    },
    roleCatalog: {
      findUnique: vi.fn()
    },
    rolePermissionTemplate: {
      createMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

import { GET, POST } from "./route";
import { requireApiSession, requireRoleManagePermission } from "@/lib/auth/guards";
import { isSystemAdmin } from "@/lib/auth/permission-evaluator";
import { getRoleUsageCounts, listAccessRoles, listRoleCatalog } from "@/lib/roles/catalog";

describe("/api/roles GET contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "user-1",
        permissions: ["manage_users", "create_role", "edit_role"]
      }
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(requireRoleManagePermission).mockResolvedValue({ ok: true } as never);
  });

  it("returns access roles in the consistent { ok, roles } shape", async () => {
    vi.mocked(listAccessRoles).mockResolvedValueOnce([
      {
        id: "role-1",
        label: "Department Admin",
        slug: "department-admin",
        kind: "access_role",
        applicability: "department",
        permissions: ["manage_users"]
      }
    ] as never);

    const response = await GET(new Request("http://localhost/api/roles?kind=access_role&scope=department&departmentId=dept-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: true,
      roles: [
        expect.objectContaining({
          id: "role-1",
          kind: "access_role",
          applicability: "department"
        })
      ]
    });
  });

  it("returns job designations in the consistent { ok, roles } shape", async () => {
    vi.mocked(listRoleCatalog).mockResolvedValueOnce([
      {
        id: "role-1",
        label: "Backend Engineer",
        slug: "backend-engineer",
        kind: "job_designation",
        departmentId: "dept-1",
        permissions: []
      }
    ] as never);
    vi.mocked(getRoleUsageCounts).mockResolvedValueOnce({
      openJobCount: 2,
      pipelineCandidateCount: 4
    });

    const response = await GET(new Request("http://localhost/api/roles?departmentId=dept-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: true,
      roles: [
        expect.objectContaining({
          id: "role-1",
          kind: "job_designation",
          openJobCount: 2,
          pipelineCandidateCount: 4
        })
      ]
    });
  });

  it("allows System Admin to list access roles without explicit role permissions", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "admin-1", permissions: [] }
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(listAccessRoles).mockResolvedValueOnce([]);

    const response = await GET(new Request("http://localhost/api/roles?kind=access_role"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("blocks non-admin without role permissions from listing access roles", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-2", permissions: [] }
    } as never);
    vi.mocked(isSystemAdmin).mockResolvedValue(false);

    const response = await GET(new Request("http://localhost/api/roles?kind=access_role"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
  });
});

describe("/api/roles POST System Admin bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
  });

  it("allows System Admin to create a role even with no explicit create_role permission", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "admin-1", permissions: [] }
    } as never);
    vi.mocked(requireRoleManagePermission).mockResolvedValue({ ok: true } as never);

    await POST(
      new Request("http://localhost/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "access_role",
          label: "Test Role",
          slug: "test-role",
          applicability: "department"
        })
      })
    );

    expect(requireRoleManagePermission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "admin-1" }),
      "create_role"
    );
  });

  it("blocks a non-admin user without create_role permission", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-2", permissions: [] }
    } as never);
    vi.mocked(requireRoleManagePermission).mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false, message: "Permission denied: create_role" }), { status: 403 })
    } as never);

    const response = await POST(
      new Request("http://localhost/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "access_role",
          label: "Test Role",
          slug: "test-role",
          applicability: "department"
        })
      })
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.message).toContain("Permission denied");
  });
});

describe("/api/roles POST Zod validation errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSystemAdmin).mockResolvedValue(false);
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-1", permissions: ["create_role"] }
    } as never);
    vi.mocked(requireRoleManagePermission).mockResolvedValue({ ok: true } as never);
  });

  it("returns human-readable message for invalid slug", async () => {
    const response = await POST(
      new Request("http://localhost/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "access_role",
          label: "Test Role",
          slug: "INVALID SLUG WITH SPACES",
          applicability: "department"
        })
      })
    );

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.message).toContain("slug");
    expect(data.message).not.toContain('"validation"');
    expect(data.message).not.toContain('"code"');
  });

  it("returns human-readable message for missing label", async () => {
    const response = await POST(
      new Request("http://localhost/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "access_role",
          label: "x",
          slug: "test-role",
          applicability: "department"
        })
      })
    );

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(typeof data.message).toBe("string");
    expect(data.message).not.toContain('"validation"');
  });
});
