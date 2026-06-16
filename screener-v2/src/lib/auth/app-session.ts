import type { Route } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getEffectivePermissions } from "@/lib/auth/permission-evaluator";
import {
  SESSION_COOKIE_NAME,
  sanitizeNextPath,
  verifySessionToken,
  type AppSession
} from "@/lib/auth/session";

export async function getAppSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;
  if (!session.userId) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      roleId: true,
      departmentId: true,
      isActive: true,
      sessionVersion: true,
      accessGrants: {
        where: { status: "active" },
        select: {
          id: true,
          scope: true,
          departmentId: true,
          role: {
            select: {
              id: true,
              slug: true,
              label: true,
              kind: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Revocation check: if the token carries a session version, it must match the
  // current value in the DB. A mismatch means the session was invalidated (password
  // reset, admin deactivation). Old tokens without sv pass through until they expire.
  if (typeof session.sv === "number" && session.sv !== user.sessionVersion) {
    return null;
  }

  // Load fresh permissions for this session
  const permissions = await getEffectivePermissions(user.id);

  // Determine effective department context from AccessGrant or legacy field
  let effectiveDepartmentId = user.departmentId;

  // Check for system admin AccessGrant
  const systemAdminGrant = user.accessGrants.find(
    (g) => g.scope === "system" && g.role.slug === "system-admin"
  );

  // If no legacy departmentId but has system admin grant, they can access all departments
  if (!effectiveDepartmentId && systemAdminGrant) {
    effectiveDepartmentId = null; // null means system-wide access
  } else if (!effectiveDepartmentId && user.accessGrants.length > 0) {
    // If they have department-scoped grants, prefer the first department
    const deptGrant = user.accessGrants.find((g) => g.scope === "department");
    if (deptGrant?.departmentId) {
      effectiveDepartmentId = deptGrant.departmentId;
    }
  }

  return {
    ...session,
    userId: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    departmentId: effectiveDepartmentId,
    permissions
  };
}

export function buildLoginHref(nextPath: string): Route {
  return `/login?next=${encodeURIComponent(sanitizeNextPath(nextPath))}` as Route;
}
