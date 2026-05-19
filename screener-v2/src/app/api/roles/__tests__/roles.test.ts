import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTestRole, createTestDepartment, createTestCandidate, cleanupTestData, testFetch, createTestJob } from "@/lib/test-utils";

describe("Roles API", () => {
  let testDepartment: any;

  beforeAll(async () => {
    testDepartment = await createTestDepartment("Test Dept");
  });

  afterEach(async () => {
    try {
      await cleanupTestData();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  describe("POST /api/roles - Create Role", () => {
    it("should reject creation with missing label", async () => {
      const response = await testFetch("/api/roles", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject creation with empty label", async () => {
      const response = await testFetch("/api/roles", {
        method: "POST",
        body: JSON.stringify({
          label: ""
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject creation with invalid departmentId", async () => {
      const response = await testFetch("/api/roles", {
        method: "POST",
        body: JSON.stringify({
          label: "Test Role",
          departmentId: "invalid-dept-id"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should successfully create role without department", async () => {
      const response = await testFetch("/api/roles", {
        method: "POST",
        body: JSON.stringify({
          label: `Test Role ${Date.now()}`
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.role.label).toBeTruthy();
    });

    it("should successfully create role with department", async () => {
      const response = await testFetch("/api/roles", {
        method: "POST",
        body: JSON.stringify({
          label: `Test Role ${Date.now()}`,
          departmentId: testDepartment.id
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.role.departmentId).toBe(testDepartment.id);
    });
  });

  describe("PUT /api/roles/[id] - Update Role", () => {
    it("should reject update with missing label", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "PUT",
        body: JSON.stringify({
          label: ""
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject update with invalid departmentId", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "PUT",
        body: JSON.stringify({
          label: role.label,
          departmentId: "invalid-dept-id"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should successfully update role label", async () => {
      const role = await createTestRole("Original Label", testDepartment.id);

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "PUT",
        body: JSON.stringify({
          label: "Updated Label",
          isActive: true
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.role.label).toBe("Updated Label");

      const updated = await prisma.roleCatalog.findUnique({
        where: { id: role.id }
      });
      expect(updated?.label).toBe("Updated Label");
    });

    it("should successfully update role isActive", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "PUT",
        body: JSON.stringify({
          label: role.label,
          isActive: false
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);
      const updated = await prisma.roleCatalog.findUnique({
        where: { id: role.id }
      });
      expect(updated?.isActive).toBe(false);
    });
  });

  describe("DELETE /api/roles/[id] - Delete Role", () => {
    it("should reject deletion with open jobs", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);
      const job = await createTestJob({
        roleId: role.id,
        departmentId: testDepartment.id,
        slug: `job-${Date.now()}`,
        title: "Open Position"
      });

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain("open job");
    });

    it("should reject deletion with pipeline candidates", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);
      const candidate = await createTestCandidate({
        roleId: role.id,
        stage: "pipeline"
      });

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain("pipeline");
    });

    it("should successfully delete role without constraints", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);
      const deleted = await prisma.roleCatalog.findUnique({
        where: { id: role.id }
      });
      expect(deleted).toBeNull();
    });

    it("should allow deletion of closed candidates", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);
      const candidate = await createTestCandidate({
        roleId: role.id,
        stage: "closed"
      });

      const response = await testFetch(`/api/roles/${role.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/roles - List Roles", () => {
    it("should return list of roles", async () => {
      const role1 = await createTestRole("Role 1", testDepartment.id);
      const role2 = await createTestRole("Role 2", testDepartment.id);

      const response = await testFetch("/api/roles", {
        method: "GET"
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.roles)).toBe(true);
      expect(data.roles.length).toBeGreaterThanOrEqual(2);
    });

    it("should include role usage counts", async () => {
      const role = await createTestRole("Test Role", testDepartment.id);
      const candidate = await createTestCandidate({
        roleId: role.id,
        stage: "pipeline"
      });

      const response = await testFetch("/api/roles", {
        method: "GET"
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      const foundRole = data.roles.find((r: any) => r.id === role.id);
      expect(foundRole).toBeTruthy();
      expect(foundRole.pipelineCandidateCount).toBeGreaterThanOrEqual(1);
    });
  });
});
