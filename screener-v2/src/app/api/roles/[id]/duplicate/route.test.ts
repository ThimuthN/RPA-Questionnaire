import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermission: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    roleCatalog: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    rolePermissionTemplate: {
      createMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("@/lib/roles/catalog", () => ({
  getRoleCatalogEntry: vi.fn()
}));

import { POST } from "./route";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getRoleCatalogEntry } from "@/lib/roles/catalog";

describe("/api/roles/[id]/duplicate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { userId: "user-1", permissions: ["create_role"] }
    } as never);
    vi.mocked(requirePermission).mockResolvedValue({ ok: true } as never);
  });

  it("returns a useful slug collision message and suggestion", async () => {
    vi.mocked(prisma.roleCatalog.findUnique)
      .mockResolvedValueOnce({
        id: "role-1",
        slug: "department-admin",
        label: "Department Admin",
        description: null,
        kind: "access_role",
        applicability: "department",
        departmentId: "dept-1",
        permissions: []
      } as never)
      .mockResolvedValueOnce({ id: "existing" } as never)
      .mockResolvedValueOnce(null as never);

    const response = await POST(
      new Request("http://localhost/api/roles/role-1/duplicate", {
        method: "POST",
        body: JSON.stringify({
          label: "Department Admin Copy",
          slug: "department-admin-copy"
        })
      }),
      { params: Promise.resolve({ id: "role-1" }) }
    );

    const data = await response.json();
    expect(response.status).toBe(409);
    expect(data).toEqual({
      ok: false,
      message: "Slug already exists. Try department-admin-copy-2.",
      suggestedSlug: "department-admin-copy-2"
    });
  });

  it("duplicates the role and returns the consistent success contract", async () => {
    vi.mocked(prisma.roleCatalog.findUnique)
      .mockResolvedValueOnce({
        id: "role-1",
        slug: "department-admin",
        label: "Department Admin",
        description: "Admin role",
        kind: "access_role",
        applicability: "department",
        departmentId: "dept-1",
        experienceLevel: null,
        requirements: null,
        permissions: [{ permission: "manage_users" }]
      } as never)
      .mockResolvedValueOnce(null as never);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) =>
      callback({
        roleCatalog: {
          create: vi.fn().mockResolvedValue({ id: "role-2" })
        },
        rolePermissionTemplate: {
          createMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      })
    );
    vi.mocked(getRoleCatalogEntry).mockResolvedValueOnce({
      id: "role-2",
      label: "Department Admin Copy",
      slug: "department-admin-copy",
      kind: "access_role",
      applicability: "department",
      permissions: ["manage_users"]
    } as never);

    const response = await POST(
      new Request("http://localhost/api/roles/role-1/duplicate", {
        method: "POST",
        body: JSON.stringify({
          label: "Department Admin Copy",
          slug: "department-admin-copy"
        })
      }),
      { params: Promise.resolve({ id: "role-1" }) }
    );

    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data).toEqual({
      ok: true,
      role: expect.objectContaining({
        id: "role-2",
        slug: "department-admin-copy"
      }),
      message: "Role duplicated."
    });
  });
});
