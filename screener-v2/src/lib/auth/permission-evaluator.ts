import { prisma } from "@/lib/db/prisma";

export async function getEffectivePermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      permissionOverrides: {
        select: {
          permission: true,
          action: true
        }
      }
    }
  });

  if (!user) {
    return [];
  }

  // Start with role permissions
  const permissions = new Set<string>();

  if (user.roleId) {
    const rolePermissions = await prisma.rolePermissionTemplate.findMany({
      where: { roleId: user.roleId },
      select: { permission: true }
    });

    rolePermissions.forEach((rp) => {
      permissions.add(rp.permission);
    });
  }

  // Apply overrides
  user.permissionOverrides.forEach((override) => {
    if (override.action === "grant") {
      permissions.add(override.permission);
    } else if (override.action === "revoke") {
      permissions.delete(override.permission);
    }
  });

  return Array.from(permissions);
}

export async function canUser(userId: string, permission: string): Promise<boolean> {
  const permissions = await getEffectivePermissions(userId);
  return permissions.includes(permission);
}
