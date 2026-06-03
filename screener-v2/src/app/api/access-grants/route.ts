import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { grantSystemAccess, grantDepartmentAccess } from "@/lib/auth/access-grants";
import { prisma } from "@/lib/db/prisma";

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

  // Require manage_users permission
  if (!auth.session.permissions.includes("manage_users")) {
    return NextResponse.json(
      { ok: false, message: "Permission denied: manage_users" },
      { status: 403 }
    );
  }

  try {
    const body = grantSchema.parse(await request.json());

    if (body.grantType === "system") {
      if (!body.roleSlug) {
        return NextResponse.json(
          { ok: false, message: "roleSlug required for system grants" },
          { status: 400 }
        );
      }

      const grant = await grantSystemAccess({
        userId: body.userId,
        roleSlug: body.roleSlug
      });

      return NextResponse.json({ ok: true, grant });
    }

    if (body.grantType === "department") {
      if (!body.roleId || !body.departmentId) {
        return NextResponse.json(
          { ok: false, message: "roleId and departmentId required for department grants" },
          { status: 400 }
        );
      }

      const grant = await grantDepartmentAccess({
        userId: body.userId,
        departmentId: body.departmentId,
        roleId: body.roleId
      });

      return NextResponse.json({ ok: true, grant });
    }

    return NextResponse.json(
      { ok: false, message: "Invalid grantType" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create grant";
    return NextResponse.json(
      { ok: false, message },
      { status: 400 }
    );
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
    return NextResponse.json(
      { ok: false, message: "Permission denied: manage_users" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "userId required" },
      { status: 400 }
    );
  }

  const grants = await prisma.accessGrant.findMany({
    where: { userId, status: "active" },
    select: {
      id: true,
      scope: true,
      department: { select: { id: true, name: true } },
      role: { select: { id: true, slug: true, label: true } }
    },
    orderBy: [{ scope: "desc" }, { department: { name: "asc" } }]
  });

  return NextResponse.json({ ok: true, grants });
}
