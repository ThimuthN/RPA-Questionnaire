import { prisma } from "@/lib/db/prisma";
import type { AppSession } from "@/lib/auth/session";

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

export async function hasGlobalPermission(userId: string, permission: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      permissionOverrides: {
        where: { permission, action: "grant" },
        select: { id: true }
      }
    }
  });

  if (!user) return false;
  if (user.permissionOverrides.length > 0) return true;
  if (!user.roleId) return false;

  const rolePermission = await prisma.rolePermissionTemplate.findUnique({
    where: {
      roleId_permission: {
        roleId: user.roleId,
        permission
      }
    },
    select: { scope: true }
  });

  return rolePermission?.scope === "global";
}

export async function canUsePermissionForDepartment(
  session: AppSession,
  permission: string,
  resourceDepartmentId?: string | null
): Promise<boolean> {
  if (!session.permissions.includes(permission)) return false;
  if (!resourceDepartmentId) return true;
  if (!session.userId) return false;
  if (await hasGlobalPermission(session.userId, permission)) return true;
  return Boolean(session.departmentId && session.departmentId === resourceDepartmentId);
}
