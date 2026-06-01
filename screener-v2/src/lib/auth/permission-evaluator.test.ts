import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasGlobalPermission } from "./permission-evaluator";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    rolePermissionTemplate: {
      findUnique: vi.fn()
    }
  }
}));

describe("permission-evaluator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hasGlobalPermission", () => {
    it("returns true when user has explicit grant override", async () => {
      const userId = "user-123";
      const permission = "view_candidates";

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: userId,
        roleId: "role-123",
        permissionOverrides: [{ id: "override-1", permission, action: "grant" }]
      } as any);

      const result = await hasGlobalPermission(userId, permission);
      expect(result).toBe(true);
    });

    it("returns true when role has global scope for permission", async () => {
      const userId = "user-123";
      const permission = "view_candidates";

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: userId,
        roleId: "role-123",
        permissionOverrides: []
      } as any);

      vi.mocked(prisma.rolePermissionTemplate.findUnique).mockResolvedValueOnce({
        scope: "global",
        permission
      } as any);

      const result = await hasGlobalPermission(userId, permission);
      expect(result).toBe(true);
    });

    it("returns false when role has scoped permission (no override)", async () => {
      const userId = "user-123";
      const permission = "view_candidates";

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: userId,
        roleId: "role-123",
        permissionOverrides: []
      } as any);

      vi.mocked(prisma.rolePermissionTemplate.findUnique).mockResolvedValueOnce({
        scope: "scoped",
        permission
      } as any);

      const result = await hasGlobalPermission(userId, permission);
      expect(result).toBe(false);
    });

    it("returns false when user has revoke override", async () => {
      const userId = "user-123";
      const permission = "view_candidates";

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: userId,
        roleId: "role-123",
        permissionOverrides: [{ id: "override-1", permission, action: "revoke" }]
      } as any);

      const result = await hasGlobalPermission(userId, permission);
      expect(result).toBe(false);
    });
  });
});
