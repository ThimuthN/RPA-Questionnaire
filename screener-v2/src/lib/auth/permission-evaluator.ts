import { prisma } from "@/lib/db/prisma";
import type { AppSession } from "@/lib/auth/session";
import { APP_ACTIONS } from "@/lib/auth/permissions";

function isKnownPermission(permission: string) {
  return APP_ACTIONS.includes(permission as (typeof APP_ACTIONS)[number]);
}

export async function getEffectivePermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      accessGrants: {
        where: { status: "active" },
        select: {
          role: {
            select: { id: true }
          }
        }
      },
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

  // Load permissions from legacy roleId if present
  if (user.roleId) {
    const rolePermissions = await prisma.rolePermissionTemplate.findMany({
      where: { roleId: user.roleId },
      select: { permission: true }
    });

    rolePermissions.forEach((rp) => {
      if (isKnownPermission(rp.permission)) {
        permissions.add(rp.permission);
      }
    });
  }

  // Load permissions from AccessGrant roles (new model)
  if (user.accessGrants.length > 0) {
    const accessGrantRoleIds = user.accessGrants.map((g) => g.role.id);
    const accessGrantPermissions = await prisma.rolePermissionTemplate.findMany({
      where: { roleId: { in: accessGrantRoleIds } },
      select: { permission: true }
    });

    accessGrantPermissions.forEach((rp) => {
      if (isKnownPermission(rp.permission)) {
        permissions.add(rp.permission);
      }
    });
  }

  // Apply overrides
  user.permissionOverrides.forEach((override) => {
    if (!isKnownPermission(override.permission)) {
      return;
    }
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
      },
      accessGrants: {
        where: { status: "active", scope: "system" },
        select: {
          role: {
            select: {
              permissions: {
                where: { permission },
                select: { scope: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) return false;
  if (user.permissionOverrides.length > 0) return true;

  // Check system-scoped AccessGrant roles (e.g., system admin)
  if (user.accessGrants && user.accessGrants.length > 0) {
    for (const grant of user.accessGrants) {
      if (grant.role.permissions.length > 0 && grant.role.permissions[0]?.scope === "global") {
        return true;
      }
    }
  }

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

export async function isSystemAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessGrants: {
        where: { status: "active", scope: "system" },
        select: {
          role: {
            select: { slug: true }
          }
        }
      }
    }
  });

  if (!user) return false;
  return user.accessGrants.some((g) => g.role.slug === "system-admin");
}

export async function canUsePermissionForDepartment(
  session: AppSession,
  permission: string,
  resourceDepartmentId?: string | null
): Promise<boolean> {
  if (!session.userId) return false;

  // System admins can use any permission on any department
  if (await isSystemAdmin(session.userId)) return true;

  if (!session.permissions.includes(permission)) return false;
  if (!resourceDepartmentId) return true;
  if (await hasGlobalPermission(session.userId, permission)) return true;
  return Boolean(session.departmentId && session.departmentId === resourceDepartmentId);
}
