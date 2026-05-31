import { describe, it, expect, vi, beforeEach } from "vitest";
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
  permissions: ["manage_candidates", "view_reports"],
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

  it("returns ok true with role null when roleId is undefined", async () => {
    const result = await validateAssignableAccessRole(undefined, "dept-1", mockSession);
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

  it("returns 400 when role does not belong to target department", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Hiring Manager",
      departmentId: "dept-2",
      permissions: [{ permission: "manage_candidates" }]
    } as any);
    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Access role must belong to the selected department."
    });
  });

  it("returns 400 when role has zero permission templates", async () => {
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Empty Role",
      departmentId: "dept-1",
      permissions: []
    } as any);
    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Selected access role has no permissions configured."
    });
  });

  it("returns 403 when non-global manager assigns role with permission outside their set", async () => {
    vi.mocked(hasGlobalPermission).mockResolvedValueOnce(false);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Admin Role",
      departmentId: "dept-1",
      permissions: [
        { permission: "manage_candidates" },
        { permission: "admin_setting" }
      ]
    } as any);
    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: false,
      status: 403,
      message: "You can only assign roles within your own permission set."
    });
  });

  it("allows non-global manager to assign role whose permissions are subset of their own", async () => {
    vi.mocked(hasGlobalPermission).mockResolvedValueOnce(false);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Candidate Manager",
      departmentId: "dept-1",
      permissions: [{ permission: "manage_candidates" }]
    } as any);
    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: true,
      role: {
        id: "role-1",
        label: "Candidate Manager",
        departmentId: "dept-1",
        permissions: ["manage_candidates"]
      }
    });
  });

  it("allows global manage_users user to assign valid access role", async () => {
    vi.mocked(hasGlobalPermission).mockResolvedValueOnce(true);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "System Admin",
      departmentId: "dept-1",
      permissions: [
        { permission: "manage_candidates" },
        { permission: "admin_setting" },
        { permission: "manage_users" }
      ]
    } as any);
    const result = await validateAssignableAccessRole("role-1", "dept-1", mockSession);
    expect(result).toEqual({
      ok: true,
      role: {
        id: "role-1",
        label: "System Admin",
        departmentId: "dept-1",
        permissions: ["manage_candidates", "admin_setting", "manage_users"]
      }
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

  it("allows null departmentId when validating", async () => {
    vi.mocked(hasGlobalPermission).mockResolvedValueOnce(false);
    vi.mocked(prisma.roleCatalog.findUnique).mockResolvedValueOnce({
      id: "role-1",
      label: "Global Role",
      departmentId: null,
      permissions: [{ permission: "manage_candidates" }]
    } as any);
    const result = await validateAssignableAccessRole("role-1", null, mockSession);
    expect(result).toEqual({
      ok: true,
      role: {
        id: "role-1",
        label: "Global Role",
        departmentId: null,
        permissions: ["manage_candidates"]
      }
    });
  });
});
