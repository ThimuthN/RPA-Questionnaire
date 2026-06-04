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
 * - Role must be an active access role
 * - Role must be valid for the target department or system scope
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
        kind: true,
        applicability: true,
        isActive: true,
        dept: {
          select: {
            slug: true
          }
        },
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

    if (role.kind !== "access_role") {
      return {
        ok: false,
        status: 400,
        message: "Only access roles can be assigned."
      };
    }

    if (!role.isActive) {
      return {
        ok: false,
        status: 400,
        message: "Selected access role is inactive."
      };
    }

    if (targetDepartmentId) {
      if (role.applicability === "system") {
        return {
          ok: false,
          status: 400,
          message: "System-only access roles cannot be assigned to a department."
        };
      }

      const ownedByTargetDepartment = role.departmentId === targetDepartmentId;
      const sharedSystemRole = role.applicability === "both" && role.dept?.slug === "system";
      if (!ownedByTargetDepartment && !sharedSystemRole) {
        return {
          ok: false,
          status: 400,
          message: "Access role is not available for the selected department."
        };
      }
    } else if (role.applicability === "department") {
      return {
        ok: false,
        status: 400,
        message: "Department-scoped access roles require a department."
      };
    }

    const rolePermissions = role.permissions.map((p: { permission: string }) => p.permission);
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
