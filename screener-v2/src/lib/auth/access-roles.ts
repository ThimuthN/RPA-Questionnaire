import { prisma } from "@/lib/db/prisma";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import type { AppSession } from "@/lib/auth/session";

export type ValidateAccessRoleResult =
  | { ok: true; role: { id: string; label: string; departmentId: string | null; permissions: string[] } }
  | { ok: false; status: number; message: string };

/**
 * Validates that a role is assignable as a user access role.
 *
 * Rules:
 * - If no roleId: ok true with role null
 * - Role must exist
 * - Role must belong to target department if specified
 * - Role must have at least one permission template
 * - Non-global managers can only assign roles within their own permission set
 */
export async function validateAssignableAccessRole(
  roleId: string | null | undefined,
  targetDepartmentId: string | null | undefined,
  assignerSession: AppSession
): Promise<ValidateAccessRoleResult | { ok: true; role: null }> {
  if (!roleId) {
    return { ok: true, role: null };
  }

  try {
    const role = await prisma.roleCatalog.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        label: true,
        departmentId: true,
        permissions: {
          select: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      return {
        ok: false,
        status: 404,
        message: "Access role not found."
      };
    }

    if (targetDepartmentId && role.departmentId !== targetDepartmentId) {
      return {
        ok: false,
        status: 400,
        message: "Access role must belong to the selected department."
      };
    }

    const rolePermissions = role.permissions.map((p: { permission: string }) => p.permission);

    if (rolePermissions.length === 0) {
      return {
        ok: false,
        status: 400,
        message: "Selected access role has no permissions configured."
      };
    }

    const isGlobalManager = assignerSession.userId ? await hasGlobalPermission(assignerSession.userId, "manage_users") : false;
    if (!isGlobalManager) {
      const outsidePermission = rolePermissions.find((perm) => !assignerSession.permissions.includes(perm));
      if (outsidePermission) {
        return {
          ok: false,
          status: 403,
          message: "You can only assign roles within your own permission set."
        };
      }
    }

    return {
      ok: true,
      role: {
        id: role.id,
        label: role.label,
        departmentId: role.departmentId,
        permissions: rolePermissions
      }
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: "Could not validate access role."
    };
  }
}
