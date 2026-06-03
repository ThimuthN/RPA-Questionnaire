import { prisma } from "@/lib/db/prisma";

/**
 * Unified access context for a viewer/user.
 * Consolidates system admin, department grants, and permissions in one place.
 */
export interface ViewerAccessContext {
  userId: string;
  isSystemAdmin: boolean;
  systemPermissions: string[];
  accessibleDepartmentIds: Set<string>;
  canAccessAllDepartments: boolean;
}

/**
 * Get the complete access context for a user in one query.
 * Prevents scattered isSystemAdmin checks and reduces N+1 queries.
 */
export async function getViewerAccessContext(
  userId: string
): Promise<ViewerAccessContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessGrants: {
        where: { status: "active" },
        select: {
          scope: true,
          departmentId: true,
          role: {
            select: {
              slug: true,
              permissions: {
                select: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    return {
      userId,
      isSystemAdmin: false,
      systemPermissions: [],
      accessibleDepartmentIds: new Set(),
      canAccessAllDepartments: false
    };
  }

  const systemGrants = user.accessGrants.filter((g) => g.scope === "system");
  const departmentGrants = user.accessGrants.filter((g) => g.scope === "department");

  const isSystemAdmin = systemGrants.some((g) => g.role.slug === "system-admin");

  // Collect all permissions from system-scoped grants
  const systemPermissions = new Set<string>();
  systemGrants.forEach((g) => {
    g.role.permissions.forEach((p) => {
      systemPermissions.add(p.permission);
    });
  });

  // Collect all accessible department IDs from department-scoped grants
  const accessibleDepartmentIds = new Set<string>();
  departmentGrants.forEach((g) => {
    if (g.departmentId) {
      accessibleDepartmentIds.add(g.departmentId);
    }
  });

  return {
    userId,
    isSystemAdmin,
    systemPermissions: Array.from(systemPermissions),
    accessibleDepartmentIds,
    canAccessAllDepartments: isSystemAdmin
  };
}
