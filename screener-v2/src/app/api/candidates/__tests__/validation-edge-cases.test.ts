import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTestCandidate, createTestDepartment, cleanupTestData, testFetch } from "@/lib/test-utils";

describe("API Validation Edge Cases", () => {
  afterEach(async () => {
    try {
      await cleanupTestData();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  describe("Email Validation", () => {
    it("should reject email with special characters", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: "test@test@test.com"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(400);
    });

    it("should reject email without domain", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: "test"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(400);
    });

    it("should accept email with subdomain", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Person",
          email: `test@${Date.now()}.company.co.uk`
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
    });

    it("should handle case-insensitive email uniqueness", async () => {
      const email = `test-${Date.now()}@example.com`;
      await createTestCandidate({ email });

      // Try to create with uppercase version - should fail due to uniqueness
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Another Person",
          email: email.toUpperCase()
        }),
        headers: { "Content-Type": "application/json" }
      });

      // Should reject due to unique constraint
      expect(response.status).toBe(400);
    });
  });

  describe("Name Validation", () => {
    it("should reject name with single character", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "A",
          email: "test@example.com"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(400);
    });

    it("should accept name with 2 characters", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "AB",
          email: `ab-${Date.now()}@example.com`
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
    });

    it("should accept name with special characters", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "José María O'Connor-Smith",
          email: `jose-${Date.now()}@example.com`
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
    });

    it("should accept very long names", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "A".repeat(100),
          email: `long-${Date.now()}@example.com`
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
    });
  });

  describe("Stage Value Validation", () => {
    it("should reject invalid stage values", async () => {
      const invalidStages = ["new", "offer", "hired", "rejected", "", "null"];

      for (const stage of invalidStages) {
        const response = await testFetch("/api/candidates", {
          method: "POST",
          body: JSON.stringify({
            fullName: "Test",
            email: `test-${stage}-${Date.now()}@example.com`,
            stage
          }),
          headers: { "Content-Type": "application/json" }
        });

        expect(response.status).toBe(400);
      }
    });

    it("should accept all valid stage values", async () => {
      const validStages = ["applicant", "pipeline", "screening", "interview", "advanced_review", "finalized", "finalized"];

      for (const stage of validStages) {
        const response = await testFetch("/api/candidates", {
          method: "POST",
          body: JSON.stringify({
            fullName: "Test",
            email: `test-${stage}-${Date.now()}@example.com`,
            stage
          }),
          headers: { "Content-Type": "application/json" }
        });

        expect([200, 201]).toContain(response.status);
      }
    });
  });

  describe("Foreign Key Constraints", () => {
    it("should reject with non-existent roleId", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test",
          email: `test-${Date.now()}@example.com`,
          roleId: "00000000-0000-0000-0000-000000000000"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(400);
    });

    it("should reject with non-existent departmentId", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test",
          email: `test-${Date.now()}@example.com`,
          departmentId: "00000000-0000-0000-0000-000000000000"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(400);
    });

    it("should reject with non-existent hrOwnerId", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test",
          email: `test-${Date.now()}@example.com`,
          hrOwnerId: "00000000-0000-0000-0000-000000000000"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(400);
    });

    it("should accept valid foreign key references", async () => {
      const dept = await createTestDepartment("Test Dept");
      const role = await prisma.roleCatalog.create({
        data: {
          label: "Test Role",
          slug: `role-${Date.now()}`,
          departmentId: dept.id
        }
      });
      const user = await prisma.user.create({
        data: {
          email: `user-${Date.now()}@test.com`,
          passwordHash: "hash"
        }
      });

      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test",
          email: `test-${Date.now()}@example.com`,
          roleId: role.id,
          departmentId: dept.id,
          hrOwnerId: user.id
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
    });
  });

  describe("Optional Field Handling", () => {
    it("should accept creation with minimal fields", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Minimal Person",
          email: `minimal-${Date.now()}@example.com`
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
      const data = await response.json();
      expect(data.candidate.roleId).toBeNull();
      expect(data.candidate.departmentId).toBeNull();
      expect(data.candidate.hrOwnerId).toBeNull();
    });

    it("should handle empty string for optional fields", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test",
          email: `test-${Date.now()}@example.com`,
          phone: "",
          positionAppliedFor: "",
          roleId: "",
          departmentId: ""
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
    });

    it("should preserve optional fields when provided", async () => {
      const response = await testFetch("/api/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test",
          email: `test-${Date.now()}@example.com`,
          phone: "555-1234",
          positionAppliedFor: "Senior Engineer",
          candidateFolderUrl: "https://drive.google.com/test",
          notesSummary: "Referred by John"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect([200, 201]).toContain(response.status);
      const data = await response.json();
      expect(data.candidate.phone).toBe("555-1234");
      expect(data.candidate.positionAppliedFor).toBe("Senior Engineer");
      expect(data.candidate.candidateFolderUrl).toBe("https://drive.google.com/test");
      expect(data.candidate.notesSummary).toBe("Referred by John");
    });
  });

  describe("Bulk Operation Validation", () => {
    it("should reject bulk operation without action parameter", async () => {
      const formData = new FormData();

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject bulk operation with missing required parameters", async () => {
      const candidate = await createTestCandidate();
      const formData = new FormData();
      formData.append("action", "set_stage");
      formData.append("candidateIds", candidate.id);
      // Missing 'stage' parameter

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle empty candidate list", async () => {
      const formData = new FormData();
      formData.append("action", "assign_owner");
      formData.append("owner", "some-user-id");
      // No candidateIds provided

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData
      });

      // Should either reject or handle gracefully
      expect([200, 400, 303]).toContain(response.status);
    });
  });
});
