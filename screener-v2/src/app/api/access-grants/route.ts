import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { grantSystemAccess, grantDepartmentAccess } from "@/lib/auth/access-grants";
import { prisma } from "@/lib/db/prisma";
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
      if (!body.roleSlug) {
        return apiError("validation_error", "roleSlug required for system grants");
      }

      const grant = await grantSystemAccess({
        userId: body.userId,
        roleSlug: body.roleSlug
      });

      return NextResponse.json({ ok: true, grant });
    }

    if (body.grantType === "department") {
      if (!body.roleId || !body.departmentId) {
        return apiError("validation_error", "roleId and departmentId required for department grants");
      }

      const grant = await grantDepartmentAccess({
        userId: body.userId,
        departmentId: body.departmentId,
        roleId: body.roleId
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
