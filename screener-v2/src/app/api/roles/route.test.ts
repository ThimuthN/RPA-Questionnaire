import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermission: vi.fn()
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

import { GET } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
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
});
