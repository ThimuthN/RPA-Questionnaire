import { describe, it, expect, vi, beforeEach } from "vitest";
import { canAccessDepartmentWorkspace, requireDepartmentWorkspaceAccess } from "./guards";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import type { AppSession } from "@/lib/auth/session";

vi.mock("@/lib/auth/permission-evaluator", () => ({
  hasGlobalPermission: vi.fn()
}));

describe("Department Workspace Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHasGlobalPermission = vi.mocked(hasGlobalPermission);

  describe("canAccessDepartmentWorkspace", () => {
    it("returns false for unauthenticated session (null userId)", async () => {
      const session: AppSession = {
        userId: null,
        email: "user@example.com",
        departmentId: "dept-1",
        roleId: null,
        permissions: [],
        exp: 9999999999
      };

      const result = await canAccessDepartmentWorkspace(session, "dept-1");
      expect(result).toBe(false);
    });

    it("returns true for same-department scoped user", async () => {
      const session: AppSession = {
        userId: "user-1",
        email: "user@example.com",
        departmentId: "dept-1",
        roleId: "role-1",
        permissions: ["view_candidates"],
        exp: 9999999999
      };

      const result = await canAccessDepartmentWorkspace(session, "dept-1");
      expect(result).toBe(true);
    });

    it("returns false for different-department scoped user without global permission", async () => {
      const session: AppSession = {
        userId: "user-1",
        email: "user@example.com",
        departmentId: "dept-1",
        roleId: "role-1",
        permissions: ["view_candidates"],
        exp: 9999999999
      };

      mockHasGlobalPermission.mockResolvedValue(false);

      const result = await canAccessDepartmentWorkspace(session, "dept-2");
      expect(result).toBe(false);
    });

    it("returns true for global admin with manage_users permission", async () => {
      const session: AppSession = {
        userId: "admin-1",
        email: "admin@example.com",
        departmentId: "system",
        roleId: "admin-role",
        permissions: ["manage_users", "view_candidates"],
        exp: 9999999999
      };

      mockHasGlobalPermission.mockImplementation(async (_userId, permission) => {
        return permission === "manage_users";
      });

      const result = await canAccessDepartmentWorkspace(session, "dept-1");
      expect(result).toBe(true);
      expect(mockHasGlobalPermission).toHaveBeenCalledWith("admin-1", expect.any(String));
    });

    it("returns true for global user with create_job permission", async () => {
      const session: AppSession = {
        userId: "recruiter-1",
        email: "recruiter@example.com",
        departmentId: "system",
        roleId: "recruiter-role",
        permissions: ["create_job"],
        exp: 9999999999
      };

      mockHasGlobalPermission.mockImplementation(async (_userId, permission) => {
        return permission === "create_job";
      });

      const result = await canAccessDepartmentWorkspace(session, "dept-2");
      expect(result).toBe(true);
    });

    it("returns true for global user with view_candidates permission", async () => {
      const session: AppSession = {
        userId: "user-1",
        email: "user@example.com",
        departmentId: "dept-99",
        roleId: "role-1",
        permissions: ["view_candidates"],
        exp: 9999999999
      };

      mockHasGlobalPermission.mockImplementation(async (_userId, permission) => {
        return permission === "view_candidates";
      });

      const result = await canAccessDepartmentWorkspace(session, "dept-1");
      expect(result).toBe(true);
    });

    it("checks multiple global permissions until one matches", async () => {
      const session: AppSession = {
        userId: "user-1",
        email: "user@example.com",
        departmentId: "dept-wrong",
        roleId: "role-1",
        permissions: ["manage_candidates"],
        exp: 9999999999
      };

      mockHasGlobalPermission.mockImplementation(async (_userId, permission) => {
        // First few are false, manage_candidates is true
        return permission === "manage_candidates";
      });

      const result = await canAccessDepartmentWorkspace(session, "dept-1");
      expect(result).toBe(true);
    });
  });

  describe("requireDepartmentWorkspaceAccess", () => {
    it("denies unauthenticated session", async () => {
      const session: AppSession = {
        userId: null,
        email: "user@example.com",
        departmentId: null,
        roleId: null,
        permissions: [],
        exp: 9999999999
      };

      const result = await requireDepartmentWorkspaceAccess(session, "dept-1");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(403);
      }
    });

    it("allows same-department scoped user", async () => {
      const session: AppSession = {
        userId: "user-1",
        email: "user@example.com",
        departmentId: "dept-1",
        roleId: "role-1",
        permissions: ["view_candidates"],
        exp: 9999999999
      };

      const result = await requireDepartmentWorkspaceAccess(session, "dept-1");
      expect(result.ok).toBe(true);
    });

    it("denies different-department scoped user without global permission", async () => {
      const session: AppSession = {
        userId: "user-1",
        email: "user@example.com",
        departmentId: "dept-1",
        roleId: "role-1",
        permissions: ["view_candidates"],
        exp: 9999999999
      };

      mockHasGlobalPermission.mockResolvedValue(false);

      const result = await requireDepartmentWorkspaceAccess(session, "dept-2");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(403);
      }
    });

    it("allows global admin accessing different department", async () => {
      const session: AppSession = {
        userId: "admin-1",
        email: "admin@example.com",
        departmentId: "system",
        roleId: "admin-role",
        permissions: ["manage_users", "view_candidates"],
        exp: 9999999999
      };

      mockHasGlobalPermission.mockImplementation(async (_userId, permission) => {
        return ["manage_users", "view_candidates"].includes(permission);
      });

      const result = await requireDepartmentWorkspaceAccess(session, "dept-1");
      expect(result.ok).toBe(true);
    });
  });
});
