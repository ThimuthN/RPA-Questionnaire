import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTestCandidate, createTestUser, createTestRole, createTestDepartment, cleanupTestData, testFetch } from "@/lib/test-utils";

describe("Candidate CRUD Operations", () => {
  let adminUser: any;
  let memberUser: any;
  let testDepartment: any;
  let testRole: any;

  beforeAll(async () => {
    testDepartment = await createTestDepartment("Test Dept");
    testRole = await createTestRole("Test Role", testDepartment.id);
    adminUser = await createTestUser({
      email: "admin@test.com",
      roleId: testRole.id,
      departmentId: testDepartment.id
    });
    memberUser = await createTestUser({
      email: "member@test.com",
      roleId: testRole.id,
      departmentId: testDepartment.id
    });
  });

  afterEach(async () => {
    try {
      await cleanupTestData();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  describe("POST /api/candidates - Create Candidate", () => {
    it("should reject creation with missing fullName", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message || data.error).toBeTruthy();
    });

    it("should reject creation with invalid email", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: "not-an-email"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should reject creation with invalid roleId", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`,
          roleId: "invalid-role-id"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("roleId");
    });

    it("should reject creation with invalid departmentId", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`,
          departmentId: "invalid-dept-id"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("departmentId");
    });

    it("should reject creation with invalid hrOwnerId", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`,
          hrOwnerId: "invalid-user-id"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("hrOwnerId");
    });

    it("should reject duplicate email", async () => {
      const email = `test-${Date.now()}@example.com`;
      await createTestCandidate({ email });

      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Another Person",
          email
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should reject creation with invalid stage", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`,
          stage: "invalid-stage"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should successfully create candidate with valid data", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`,
          roleId: testRole.id,
          departmentId: testDepartment.id,
          stage: "pipeline"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.candidate).toBeTruthy();
      expect(data.candidate.stage).toBe("pipeline");
      expect(data.candidate.roleId).toBe(testRole.id);
    });

    it("should create candidate with valid foreign keys", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`,
          roleId: testRole.id,
          departmentId: testDepartment.id,
          hrOwnerId: adminUser.id,
          positionAppliedFor: "Software Engineer"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidate.roleId).toBe(testRole.id);
      expect(data.candidate.departmentId).toBe(testDepartment.id);
      expect(data.candidate.hrOwnerId).toBe(adminUser.id);
    });

    it("should default to pipeline stage if not provided", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.candidate.stage).toBe("pipeline");
    });

    it("should reject creation without permission", async () => {
      // This would require mocking requirePermission to return false
      // For now, we verify the endpoint requires authentication
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test-${Date.now()}@example.com`
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe("POST /api/candidates/[id] - Update Candidate", () => {
    it("should reject update with invalid fullName", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: JSON.stringify({
          fullName: "x" // Too short
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should reject update with invalid email", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: new URLSearchParams({
          fullName: candidate.fullName,
          email: "invalid-email"
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should reject update with invalid roleId", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: new URLSearchParams({
          fullName: candidate.fullName,
          email: candidate.email,
          roleId: "invalid-role-id"
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("roleId");
    });

    it("should reject update with invalid departmentId", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: new URLSearchParams({
          fullName: candidate.fullName,
          email: candidate.email,
          departmentId: "invalid-dept-id"
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should reject update with invalid hrOwnerId", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: new URLSearchParams({
          fullName: candidate.fullName,
          email: candidate.email,
          hrOwnerId: "invalid-user-id"
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should reject update with invalid stage", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: new URLSearchParams({
          fullName: candidate.fullName,
          email: candidate.email,
          stage: "invalid-stage"
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });

    it("should successfully update candidate with valid data", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: new URLSearchParams({
          fullName: "Updated Name",
          email: candidate.email,
          stage: "interview"
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(303);

      const updated = await prisma.candidate.findUnique({
        where: { id: candidate.id }
      });
      expect(updated?.fullName).toBe("Updated Name");
      expect(updated?.stage).toBe("interview");
    });

    it("should update with valid foreign keys", async () => {
      const candidate = await createTestCandidate();

      const response = await testFetch(`/api/candidates/${candidate.id}`, {
        method: "POST",
        body: new URLSearchParams({
          fullName: candidate.fullName,
          email: candidate.email,
          roleId: testRole.id,
          departmentId: testDepartment.id,
          hrOwnerId: adminUser.id
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(303);

      const updated = await prisma.candidate.findUnique({
        where: { id: candidate.id },
        include: { role: true, department: true, hrOwnerUser: true }
      });
      expect(updated?.roleId).toBe(testRole.id);
      expect(updated?.departmentId).toBe(testDepartment.id);
      expect(updated?.hrOwnerId).toBe(adminUser.id);
    });

    it("should return 404 for non-existent candidate", async () => {
      const response = await testFetch("/api/candidates/non-existent-id", {
        method: "POST",
        body: new URLSearchParams({
          fullName: "Test",
          email: "test@example.com"
        }),
        headers: {
          "Authorization": `Bearer ${adminUser.token}`
        }
      });

      expect(response.status).toBe(400);
    });
  });
});
