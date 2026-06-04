import { describe, expect, it, vi } from "vitest";
import { cleanupJobDesignationPermissionTemplates } from "@/lib/roles/job-designation-permissions-cleanup";

describe("cleanupJobDesignationPermissionTemplates", () => {
  it("reports matching rows without deleting them in dry-run mode", async () => {
    const client = {
      rolePermissionTemplate: {
        findMany: vi.fn().mockResolvedValue([{ id: "perm-1" }, { id: "perm-2" }]),
        deleteMany: vi.fn()
      }
    };

    const result = await cleanupJobDesignationPermissionTemplates(client);

    expect(result).toEqual({
      apply: false,
      matchingCount: 2,
      deletedCount: 0
    });
    expect(client.rolePermissionTemplate.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes only the matched job designation permission rows when apply=true", async () => {
    const client = {
      rolePermissionTemplate: {
        findMany: vi.fn().mockResolvedValue([{ id: "perm-1" }, { id: "perm-2" }]),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 })
      }
    };

    const result = await cleanupJobDesignationPermissionTemplates(client, { apply: true });

    expect(client.rolePermissionTemplate.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["perm-1", "perm-2"]
        }
      }
    });
    expect(result).toEqual({
      apply: true,
      matchingCount: 2,
      deletedCount: 2
    });
  });
});
