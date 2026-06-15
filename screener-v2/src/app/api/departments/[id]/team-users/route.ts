import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createRequestLogContext, logRouteError, messageFromError } from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logContext = createRequestLogContext(request, "api.departments.team_users");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_candidates", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const accessGrantUsers = await prisma.accessGrant.findMany({
      where: {
        departmentId,
        scope: "department",
        status: "active"
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { user: { name: "asc" } },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      users: accessGrantUsers.map((grant) => grant.user)
    });
  } catch (error) {
    logRouteError("departments_team_users_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to list team users");
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
