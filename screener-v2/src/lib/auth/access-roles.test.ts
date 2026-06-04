import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateAssignableAccessRole } from "@/lib/auth/access-roles";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import type { AppSession } from "@/lib/auth/session";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    roleCatalog: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  hasGlobalPermission: vi.fn()
}));

import { prisma } from "@/lib/db/prisma";

const mockSession = {
  userId: "user-123",
  email: "user@example.com",
  roleId: null,
  departmentId: null,
  permissions: ["manage_candidates", "view_reports", "manage_users"],
  exp: Math.floor(Date.now() / 1000) + 3600
} as AppSession;

describe("validateAssignableAccessRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok true with role null when roleId is not provided", async () => {
    const result = await validateAssignableAccessRole(null, "dept-1", mockSession);
    expect(result).toEqual({ ok: true, role: null });
  });

  it("returns 404 when role does not exist", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce(null);
    const result = await validateAssignableAccessRole("missing-role", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "Access role not found."
    });
  });

  it("rejects non-access roles", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Engineer",
      kind: "job_designation",
      applicability: "department",
      departmentId: "dept-1",
      isActive: true,
      dept: { slug: "engineering" },
      permissions: []
    } as never);

    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Only access roles can be assigned."
    });
  });

  it("rejects inactive access roles", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Hiring Manager",
      kind: "access_role",
      applicability: "department",
      departmentId: "dept-1",
      isActive: false,
      dept: { slug: "engineering" },
      permissions: []
    } as never);

    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Selected access role is inactive."
    });
  });

  it("rejects system-only roles for department assignment", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "System Admin",
      kind: "access_role",
      applicability: "system",
      departmentId: "system-dept",
      isActive: true,
      dept: { slug: "system" },
      permissions: [{ permission: "manage_users" }]
    } as never);

    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "System-only access roles cannot be assigned to a department."
    });
  });

  it("rejects roles that are not available for the selected department", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Ops Manager",
      kind: "access_role",
      applicability: "department",
      departmentId: "dept-2",
      isActive: true,
      dept: { slug: "operations" },
      permissions: [{ permission: "manage_candidates" }]
    } as never);

    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Access role is not available for the selected department."
    });
  });

  it("allows shared system both-scope roles in department assignment", async () => {
    vi.mocked(hasGlobalPermission).mockResolvedValueOnce(false);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Recruiting Ops",
      kind: "access_role",
      applicability: "both",
      departmentId: "system-dept",
      isActive: true,
      dept: { slug: "system" },
      permissions: [{ permission: "manage_candidates" }]
    } as never);

    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: true,
      role: {
        id: "role-1",
        label: "Recruiting Ops",
        departmentId: "system-dept",
        permissions: ["manage_candidates"]
      }
    });
  });

  it("returns 403 when non-global manager assigns role with permission outside their set", async () => {
    vi.mocked(hasGlobalPermission).mockResolvedValueOnce(false);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Admin Role",
      kind: "access_role",
      applicability: "department",
      departmentId: "dept-1",
      isActive: true,
      dept: { slug: "engineering" },
      permissions: [{ permission: "admin_setting" }]
    } as never);

    const limitedSession = { ...mockSession, permissions: ["manage_candidates"] };
    const result = await validateAssignableAccessRole("role-1", "dept-1", limitedSession);
    expect(result).toEqual({
      ok: false,
      status: 403,
      message: "You can only assign roles within your own permission set."
    });
  });

  it("allows global manage_users user to assign valid access role", async () => {
    vi.mocked(hasGlobalPermission).mockResolvedValueOnce(true);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "System Admin",
      kind: "access_role",
      applicability: "both",
      departmentId: "system-dept",
      isActive: true,
      dept: { slug: "system" },
      permissions: [
        { permission: "manage_candidates" },
        { permission: "admin_setting" },
        { permission: "manage_users" }
      ]
    } as never);

    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: true,
      role: {
        id: "role-1",
        label: "System Admin",
        departmentId: "system-dept",
        permissions: ["manage_candidates", "admin_setting", "manage_users"]
      }
    });
  });

  it("rejects department-scoped roles when no department is provided", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Team Lead",
      kind: "access_role",
      applicability: "department",
      departmentId: "dept-1",
      isActive: true,
      dept: { slug: "engineering" },
      permissions: [{ permission: "manage_candidates" }]
    } as never);

    const result = await validateAssignableAccessRole("role-1", null, mockSession);
    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Department-scoped access roles require a department."
    });
  });

  it("catches exceptions and returns generic 500 error", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockRejectedValueOnce(new Error("Database error"));
    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 500,
      message: "Could not validate access role."
    });
  });
});
