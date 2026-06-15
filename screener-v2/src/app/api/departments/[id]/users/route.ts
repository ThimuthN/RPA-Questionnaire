import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { validateAssignableAccessRole } from "@/lib/auth/access-roles";
import { revokeDepartmentAccess } from "@/lib/auth/access-grants";
import { logAudit } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";

const assignUserSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  roleId: z.string().min(1, "Role ID required")
});

const removeUserSchema = z.object({
  userId: z.string().min(1, "User ID required")
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId } = await params;
  const permission = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
  if (!permission.ok) return permission.response;

  try {
    const body = assignUserSchema.parse(await request.json());

    // Verify department exists
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true }
    });
    if (!dept) {
      return NextResponse.json(
        { ok: false, message: "Department not found" },
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 }
      );
    }

    const validation = await validateAssignableAccessRole(body.roleId, departmentId, auth.session);
    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, message: validation.message },
        { status: validation.status }
      );
    }

    // Assign user to department and role
    await prisma.user.update({
      where: { id: body.userId },
      data: {
        departmentId,
        roleId: body.roleId
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid request", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to assign user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId } = await params;
  const permission = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
  if (!permission.ok) return permission.response;

  try {
    const body = removeUserSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { departmentId: true }
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Revoke the department-scoped AccessGrant(s) — this is what actually drops effective
    // access (authz reads AccessGrant, not the legacy User columns).
    const { revoked } = await revokeDepartmentAccess({ userId: body.userId, departmentId });

    // Backward-compat: also clear the legacy columns when they point at this department.
    const legacyMatch = user.departmentId === departmentId;
    if (legacyMatch) {
      await prisma.user.update({
        where: { id: body.userId },
        data: { departmentId: null, roleId: null }
      });
    }

    if (revoked === 0 && !legacyMatch) {
      return NextResponse.json(
        { ok: false, message: "User does not belong to this department" },
        { status: 400 }
      );
    }

    await logAudit({
      action: "department_access_revoked",
      actorId: auth.session.userId ?? null,
      actorEmail: auth.session.email ?? undefined,
      targetId: body.userId,
      targetType: "user",
      after: { departmentId, revokedGrants: revoked }
    });

    return NextResponse.json({ ok: true, revoked });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid request", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to remove user" },
      { status: 500 }
    );
  }
}
