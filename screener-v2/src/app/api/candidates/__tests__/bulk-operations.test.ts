import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTestCandidate, createTestUser, createTestRole, createTestDepartment, cleanupTestData, testFetch } from "@/lib/test-utils";

describe("Candidate Bulk Operations", () => {
  let testUser: any;
  let testDepartment: any;
  let testRole: any;

  beforeAll(async () => {
    testDepartment = await createTestDepartment("Test Dept");
    testRole = await createTestRole("Test Role", testDepartment.id);
    testUser = await createTestUser({
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

  describe("POST /api/candidates/bulk - Assign Owner", () => {
    it("should reject bulk operation without action", async () => {
      const formData = new FormData();

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject invalid action", async () => {
      const formData = new FormData();
      formData.append("action", "invalid-action");

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should successfully assign owner to candidates", async () => {
      const candidate1 = await createTestCandidate();
      const candidate2 = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "assign_owner");
      formData.append("owner", testUser.id);
      formData.append("candidateIds", candidate1.id);
      formData.append("candidateIds", candidate2.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect([200, 303]).toContain(response.status);

      const c1 = await prisma.candidate.findUnique({
        where: { id: candidate1.id }
      });
      const c2 = await prisma.candidate.findUnique({
        where: { id: candidate2.id }
      });
      expect(c1?.hrOwnerId).toBe(testUser.id);
      expect(c2?.hrOwnerId).toBe(testUser.id);
    });

    it("should reject assign_owner without owner parameter", async () => {
      const candidate = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "assign_owner");
      formData.append("candidateIds", candidate.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/candidates/bulk - Set Stage", () => {
    it("should successfully set stage for multiple candidates", async () => {
      const candidate1 = await createTestCandidate({ stage: "pipeline" });
      const candidate2 = await createTestCandidate({ stage: "pipeline" });

      const formData = new FormData();
      formData.append("action", "set_stage");
      formData.append("stage", "screening");
      formData.append("candidateIds", candidate1.id);
      formData.append("candidateIds", candidate2.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect([200, 303]).toContain(response.status);

      const c1 = await prisma.candidate.findUnique({
        where: { id: candidate1.id }
      });
      const c2 = await prisma.candidate.findUnique({
        where: { id: candidate2.id }
      });
      expect(c1?.stage).toBe("screening");
      expect(c2?.stage).toBe("screening");
    });

    it("should reject set_stage with invalid stage", async () => {
      const candidate = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "set_stage");
      formData.append("stage", "invalid-stage");
      formData.append("candidateIds", candidate.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/candidates/bulk - Set Department", () => {
    it("should successfully set department for multiple candidates", async () => {
      const candidate1 = await createTestCandidate();
      const candidate2 = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "set_department");
      formData.append("departmentId", testDepartment.id);
      formData.append("candidateIds", candidate1.id);
      formData.append("candidateIds", candidate2.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect([200, 303]).toContain(response.status);

      const c1 = await prisma.candidate.findUnique({
        where: { id: candidate1.id }
      });
      const c2 = await prisma.candidate.findUnique({
        where: { id: candidate2.id }
      });
      expect(c1?.departmentId).toBe(testDepartment.id);
      expect(c2?.departmentId).toBe(testDepartment.id);
    });

    it("should reject set_department with invalid departmentId", async () => {
      const candidate = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "set_department");
      formData.append("departmentId", "invalid-dept-id");
      formData.append("candidateIds", candidate.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/candidates/bulk - Add Note", () => {
    it("should successfully add note to multiple candidates", async () => {
      const candidate1 = await createTestCandidate();
      const candidate2 = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "add_note");
      formData.append("noteType", "internal");
      formData.append("noteBody", "Test note");
      formData.append("candidateIds", candidate1.id);
      formData.append("candidateIds", candidate2.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect([200, 303]).toContain(response.status);

      const c1Notes = await prisma.candidateNote.findMany({
        where: { candidateId: candidate1.id }
      });
      const c2Notes = await prisma.candidateNote.findMany({
        where: { candidateId: candidate2.id }
      });
      expect(c1Notes.length).toBeGreaterThan(0);
      expect(c2Notes.length).toBeGreaterThan(0);
    });

    it("should reject add_note with invalid note type", async () => {
      const candidate = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "add_note");
      formData.append("noteType", "invalid-type");
      formData.append("noteBody", "Test");
      formData.append("candidateIds", candidate.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/candidates/bulk - Set Org Status", () => {
    it("should successfully set org status for multiple candidates", async () => {
      const candidate1 = await createTestCandidate();
      const candidate2 = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "set_org_status");
      formData.append("orgStatus", "talent_pool");
      formData.append("candidateIds", candidate1.id);
      formData.append("candidateIds", candidate2.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect([200, 303]).toContain(response.status);

      const c1 = await prisma.candidate.findUnique({
        where: { id: candidate1.id }
      });
      const c2 = await prisma.candidate.findUnique({
        where: { id: candidate2.id }
      });
      expect(c1?.orgStatus).toBe("talent_pool");
      expect(c2?.orgStatus).toBe("talent_pool");
    });

    it("should reject set_org_status with invalid status", async () => {
      const candidate = await createTestCandidate();

      const formData = new FormData();
      formData.append("action", "set_org_status");
      formData.append("orgStatus", "invalid-status");
      formData.append("candidateIds", candidate.id);

      const response = await testFetch("/api/candidates/bulk", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${testUser.token}`
        }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
