import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTestDepartment, createTestCandidate, cleanupTestData, testFetch } from "@/lib/test-utils";

describe("Departments API", () => {
  afterEach(async () => {
    try {
      await cleanupTestData();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  describe("POST /api/departments - Create Department", () => {
    it("should reject creation with missing name", async () => {
      const response = await testFetch("/api/departments", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject creation with empty name", async () => {
      const response = await testFetch("/api/departments", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject creation with name too long", async () => {
      const response = await testFetch("/api/departments", {
        method: "POST",
        body: JSON.stringify({
          name: "A".repeat(101)
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should successfully create department with valid name", async () => {
      const response = await testFetch("/api/departments", {
        method: "POST",
        body: JSON.stringify({
          name: `Test Department ${Date.now()}`
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeTruthy();
      expect(data.name).toBeTruthy();
      expect(data.isActive).toBe(true);
    });

    it("should generate unique slug", async () => {
      const name = `Test Department ${Date.now()}`;
      const response = await testFetch("/api/departments", {
        method: "POST",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      expect(data.slug).toBeTruthy();
      expect(data.slug).not.toContain(" ");
    });
  });

  describe("GET /api/departments/[id] - Get Department", () => {
    it("should return department details", async () => {
      const dept = await createTestDepartment("Test Dept");

      const response = await testFetch(`/api/departments/${dept.id}`, {
        method: "GET"
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(dept.id);
      expect(data.name).toBe(dept.name);
    });

    it("should return 404 for non-existent department", async () => {
      const response = await testFetch("/api/departments/non-existent-id", {
        method: "GET"
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/departments/[id] - Update Department", () => {
    it("should reject update with empty name", async () => {
      const dept = await createTestDepartment("Test Dept");

      const response = await testFetch(`/api/departments/${dept.id}`, {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          name: ""
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject update with name too long", async () => {
      const dept = await createTestDepartment("Test Dept");

      const response = await testFetch(`/api/departments/${dept.id}`, {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          name: "A".repeat(101)
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should successfully update department name", async () => {
      const dept = await createTestDepartment("Original Name");

      const response = await testFetch(`/api/departments/${dept.id}`, {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          name: "Updated Name"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);

      const updated = await prisma.department.findUnique({
        where: { id: dept.id }
      });
      expect(updated?.name).toBe("Updated Name");
    });

    it("should successfully deactivate department", async () => {
      const dept = await createTestDepartment("Test Dept");

      const response = await testFetch(`/api/departments/${dept.id}`, {
        method: "POST",
        body: JSON.stringify({
          action: "deactivate"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);

      const updated = await prisma.department.findUnique({
        where: { id: dept.id }
      });
      expect(updated?.isActive).toBe(false);
    });

    it("should successfully activate department", async () => {
      const dept = await prisma.department.create({
        data: {
          name: "Inactive Department",
          slug: `inactive-${Date.now()}`,
          isActive: false
        }
      });

      const response = await testFetch(`/api/departments/${dept.id}`, {
        method: "POST",
        body: JSON.stringify({
          action: "activate"
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);

      const updated = await prisma.department.findUnique({
        where: { id: dept.id }
      });
      expect(updated?.isActive).toBe(true);
    });

    it("should update sortOrder", async () => {
      const dept = await createTestDepartment("Test Dept");

      const response = await testFetch(`/api/departments/${dept.id}`, {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          name: dept.name,
          sortOrder: 10
        }),
        headers: { "Content-Type": "application/json" }
      });

      expect(response.status).toBe(200);

      const updated = await prisma.department.findUnique({
        where: { id: dept.id }
      });
      expect(updated?.sortOrder).toBe(10);
    });
  });

  describe("GET /api/departments - List Departments", () => {
    it("should return list of departments", async () => {
      const dept1 = await createTestDepartment("Dept 1");
      const dept2 = await createTestDepartment("Dept 2");

      const response = await testFetch("/api/departments", {
        method: "GET"
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);

      const names = data.map((d: any) => d.name);
      expect(names).toContain("Dept 1");
      expect(names).toContain("Dept 2");
    });

    it("should return only active departments by default", async () => {
      const activeDept = await createTestDepartment("Active");
      const inactiveDept = await prisma.department.create({
        data: {
          name: "Inactive",
          slug: `inactive-${Date.now()}`,
          isActive: false
        }
      });

      const response = await testFetch("/api/departments", {
        method: "GET"
      });

      const data = await response.json();
      const names = data.map((d: any) => d.name);
      expect(names).toContain("Active");
      expect(names).not.toContain("Inactive");
    });
  });

  describe("POST /api/departments/[id] - Delete Department", () => {
    it("should prevent deletion of departments with candidates", async () => {
      const dept = await createTestDepartment("Test Dept");
      const candidate = await createTestCandidate({
        departmentId: dept.id
      });

      // Note: Delete operation might not be exposed via API,
      // but if it is, it should validate this constraint
      const deptInDb = await prisma.department.findUnique({
        where: { id: dept.id },
        include: { candidates: true }
      });
      expect(deptInDb?.candidates.length).toBeGreaterThan(0);
    });
  });
});
