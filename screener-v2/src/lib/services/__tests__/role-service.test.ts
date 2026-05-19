import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { roleService } from "@/lib/services/role-service";
import { createTestDepartment, createTestCandidate, cleanupTestData } from "@/lib/test-utils";

describe("RoleService", () => {
  let testDept: any;

  beforeAll(async () => {
    testDept = await createTestDepartment("Test Dept");
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe("createRole", () => {
    it("should reject empty label", async () => {
      expect(() => roleService.createRole("")).rejects.toThrow("at least 2 characters");
    });

    it("should reject invalid departmentId", async () => {
      expect(() => roleService.createRole("Test Role", "invalid-id")).rejects.toThrow("Department not found");
    });

    it("should create role without department", async () => {
      const role = await roleService.createRole("Test Role");
      expect(role.label).toBe("Test Role");
      expect(role.departmentId).toBeNull();
    });

    it("should create role with valid department", async () => {
      const role = await roleService.createRole("Test Role", testDept.id);
      expect(role.label).toBe("Test Role");
      expect(role.departmentId).toBe(testDept.id);
    });
  });

  describe("deleteRole", () => {
    it("should successfully delete role with no constraints", async () => {
      const role = await roleService.createRole("Test Role", testDept.id);
      const deleted = await roleService.deleteRole(role.id);
      expect(deleted.id).toBe(role.id);
    });

    it("should reject deletion with pipeline candidates", async () => {
      const role = await roleService.createRole("Test Role", testDept.id);
      await createTestCandidate({
        roleId: role.id,
        stage: "pipeline"
      });

      expect(() => roleService.deleteRole(role.id)).rejects.toThrow("pipeline");
    });

    it("should allow deletion with closed candidates", async () => {
      const role = await roleService.createRole("Test Role", testDept.id);
      await createTestCandidate({
        roleId: role.id,
        stage: "closed"
      });

      const deleted = await roleService.deleteRole(role.id);
      expect(deleted.id).toBe(role.id);
    });
  });

  describe("listRoles", () => {
    it("should return list of roles", async () => {
      const role1 = await roleService.createRole("Role 1", testDept.id);
      const role2 = await roleService.createRole("Role 2", testDept.id);

      const roles = await roleService.listRoles();
      const ids = roles.map(r => r.id);
      expect(ids).toContain(role1.id);
      expect(ids).toContain(role2.id);
    });
  });

  describe("getRoleWithCounts", () => {
    it("should return role with counts", async () => {
      const role = await roleService.createRole("Test Role", testDept.id);
      const withCounts = await roleService.getRoleWithCounts(role.id);

      expect(withCounts.label).toBe("Test Role");
      expect(withCounts.openJobCount).toBe(0);
      expect(withCounts.pipelineCandidateCount).toBe(0);
    });
  });
});
