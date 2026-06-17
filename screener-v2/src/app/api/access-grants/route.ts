import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { isSystemAdmin } from "@/lib/auth/permission-evaluator";
import { grantSystemAccess, grantDepartmentAccess } from "@/lib/auth/access-grants";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/lib/auth/audit";
import { apiError } from "@/lib/server/api-error";

const grantSchema = z.object({
  userId: z.string(),
  grantType: z.enum(["system", "department"]),
  roleSlug: z.string().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
  scope: z.enum(["system", "department"]).optional()
});

/**
 * POST /api/access-grants
 * Create a new AccessGrant for a user.
 */
export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  if (!auth.session.permissions.includes("manage_users")) {
    return apiError("forbidden", "Permission denied: manage_users");
  }

  try {
    const body = grantSchema.parse(await request.json());

    if (body.grantType === "system") {
      // Least-privilege: only a system admin may grant SYSTEM-scoped access.
      // (Without this, any department-scoped manage_users holder could self-escalate.)
      const actorId = auth.session.userId;
      if (!actorId || !(await isSystemAdmin(actorId))) {
        return apiError("forbidden", "Only system admins can grant system access.");
      }
      if (!body.roleSlug) {
        return apiError("validation_error", "roleSlug required for system grants");
      }

      const grant = await grantSystemAccess({
        userId: body.userId,
        roleSlug: body.roleSlug
      });

      await logAudit({
        action: "system_access_granted",
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        targetId: body.userId,
        targetType: "user",
        after: { roleSlug: body.roleSlug, scope: "system" },
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json({ ok: true, grant });
    }

    if (body.grantType === "department") {
      if (!body.roleId || !body.departmentId) {
        return apiError("validation_error", "roleId and departmentId required for department grants");
      }

      // Must hold manage_users in the TARGET department (not just anywhere).
      const deptPermission = await requirePermissionForDepartment(auth.session, "manage_users", body.departmentId);
      if (!deptPermission.ok) {
        return deptPermission.response;
      }

      const grant = await grantDepartmentAccess({
        userId: body.userId,
        departmentId: body.departmentId,
        roleId: body.roleId
      });

      await logAudit({
        action: "department_access_granted",
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        targetId: body.userId,
        targetType: "user",
        after: { roleId: body.roleId, departmentId: body.departmentId, scope: "department" },
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json({ ok: true, grant });
    }

    return apiError("validation_error", "Invalid grantType");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create grant";
    return apiError("validation_error", message);
  }
}

/**
 * GET /api/access-grants?userId=...
 * List user's access grants.
 */
export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  if (!auth.session.permissions.includes("manage_users")) {
    return apiError("forbidden", "Permission denied: manage_users");
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return apiError("validation_error", "userId required");
  }

  const grants = await prisma.accessGrant.findMany({
    where: { userId, status: "active" },
    select: {
      id: true,
      scope: true,
      department: { select: { id: true, name: true } },
      role: { select: { id: true, slug: true, label: true } }
    },
    orderBy: [{ scope: "desc" }, { department: { name: "asc" } }],
    take: 100,
  });

  return NextResponse.json({ ok: true, grants });
}
