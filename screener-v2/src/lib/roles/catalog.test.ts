import { describe, expect, it, vi, beforeEach } from "vitest";
import { listRoleCatalog } from "@/lib/roles/catalog";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    roleCatalog: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    department: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn()
}));

describe("role catalog safe access for orphaned departments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listRoleCatalog with missing department relation", () => {
    it("does not throw when a role has an orphaned department reference", async () => {
      const mockRoles = [
        {
          id: "role-1",
          slug: "engineer",
          label: "Engineer",
          departmentId: "dept-1",
          department: null,
          description: "Engineer role",
          experienceLevel: "mid",
          requirements: "5+ years",
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        },
        {
          id: "role-2",
          slug: "manager",
          label: "Manager",
          departmentId: "orphan-dept-id",
          department: null,
          description: "Manager role",
          experienceLevel: "senior",
          requirements: "10+ years",
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        }
      ];

      const mockDepts = [
        { id: "dept-1", name: "Engineering" }
      ];

      (prisma.roleCatalog.findMany as any).mockResolvedValue(mockRoles);
      (prisma.department.findMany as any).mockResolvedValue(mockDepts);

      const result = await listRoleCatalog();

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe("Engineer");
      expect(result[0].departmentName).toBe("Engineering");
      expect(result[1].label).toBe("Manager");
      expect(result[1].departmentName).toBeUndefined();
    });

    it("returns all roles with valid departments intact", async () => {
      const mockRoles = [
        {
          id: "role-1",
          slug: "engineer",
          label: "Engineer",
          departmentId: "dept-1",
          department: null,
          description: "Engineer role",
          experienceLevel: "mid",
          requirements: "5+ years",
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        },
        {
          id: "role-2",
          slug: "designer",
          label: "Designer",
          departmentId: "dept-2",
          department: null,
          description: "Designer role",
          experienceLevel: "mid",
          requirements: "3+ years",
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        }
      ];

      const mockDepts = [
        { id: "dept-1", name: "Engineering" },
        { id: "dept-2", name: "Design" }
      ];

      (prisma.roleCatalog.findMany as any).mockResolvedValue(mockRoles);
      (prisma.department.findMany as any).mockResolvedValue(mockDepts);

      const result = await listRoleCatalog();

      expect(result).toHaveLength(2);
      expect(result[0].departmentName).toBe("Engineering");
      expect(result[1].departmentName).toBe("Design");
    });

    it("respects isActive filter even with missing departments", async () => {
      const mockRoles = [
        {
          id: "role-1",
          slug: "engineer",
          label: "Engineer",
          departmentId: "orphan-dept",
          department: null,
          description: "Engineer role",
          experienceLevel: "mid",
          requirements: "5+ years",
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        }
      ];

      (prisma.roleCatalog.findMany as any).mockResolvedValue(mockRoles);
      (prisma.department.findMany as any).mockResolvedValue([]);

      const result = await listRoleCatalog(false);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it("preserves role id and metadata when department is missing", async () => {
      const mockRoles = [
        {
          id: "role-with-orphan",
          slug: "specialist",
          label: "Specialist",
          departmentId: "missing-dept",
          department: null,
          description: "Specialized role",
          experienceLevel: "senior",
          requirements: "8+ years",
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          permissions: [
            { permission: "manage_candidates" },
            { permission: "view_candidates" }
          ]
        }
      ];

      (prisma.roleCatalog.findMany as any).mockResolvedValue(mockRoles);
      (prisma.department.findMany as any).mockResolvedValue([]);

      const result = await listRoleCatalog();

      expect(result[0].id).toBe("role-with-orphan");
      expect(result[0].slug).toBe("specialist");
      expect(result[0].label).toBe("Specialist");
      expect(result[0].description).toBe("Specialized role");
      expect(result[0].experienceLevel).toBe("senior");
      expect(result[0].requirements).toBe("8+ years");
      expect(result[0].permissions).toEqual([]);
      expect(result[0].departmentName).toBeUndefined();
    });

    it("handles mixed valid and orphaned department references", async () => {
      const mockRoles = [
        {
          id: "role-1",
          slug: "role-a",
          label: "Role A",
          departmentId: "dept-1",
          department: null,
          description: null,
          experienceLevel: null,
          requirements: null,
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        },
        {
          id: "role-2",
          slug: "role-b",
          label: "Role B",
          departmentId: "orphan-1",
          department: null,
          description: null,
          experienceLevel: null,
          requirements: null,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        },
        {
          id: "role-3",
          slug: "role-c",
          label: "Role C",
          departmentId: "dept-2",
          department: null,
          description: null,
          experienceLevel: null,
          requirements: null,
          sortOrder: 2,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        }
      ];

      const mockDepts = [
        { id: "dept-1", name: "Sales" },
        { id: "dept-2", name: "Support" }
      ];

      (prisma.roleCatalog.findMany as any).mockResolvedValue(mockRoles);
      (prisma.department.findMany as any).mockResolvedValue(mockDepts);

      const result = await listRoleCatalog();

      expect(result).toHaveLength(3);
      expect(result[0].departmentName).toBe("Sales");
      expect(result[1].departmentName).toBeUndefined();
      expect(result[2].departmentName).toBe("Support");
    });
  });

  describe("role catalog with empty department list", () => {
    it("handles roles when no departments exist in database", async () => {
      const mockRoles = [
        {
          id: "role-1",
          slug: "engineer",
          label: "Engineer",
          departmentId: "any-dept",
          department: null,
          description: null,
          experienceLevel: null,
          requirements: null,
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          permissions: []
        }
      ];

      (prisma.roleCatalog.findMany as any).mockResolvedValue(mockRoles);
      (prisma.department.findMany as any).mockResolvedValue([]);

      const result = await listRoleCatalog();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("role-1");
      expect(result[0].departmentName).toBeUndefined();
    });
  });
});
