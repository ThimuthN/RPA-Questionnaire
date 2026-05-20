import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";

const permissionSchema = z.object({
  overrides: z.array(
    z.object({
      permission: z.string().refine((value) => APP_ACTIONS.includes(value as (typeof APP_ACTIONS)[number])),
      action: z.enum(["grant", "revoke"])
    })
  )
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, departmentId: true }
    });
    if (!targetUser) {
      return NextResponse.json({ ok: false, message: "User not found." }, { status: 404 });
    }

    const permission = await requirePermissionForDepartment(auth.session, "manage_users", targetUser.departmentId);
    if (!permission.ok) return permission.response;

    const body = permissionSchema.parse(await request.json());
    const isGlobalManager = auth.session.userId
      ? await hasGlobalPermission(auth.session.userId, "manage_users")
      : false;

    if (!isGlobalManager) {
      const outsideActor = body.overrides.find(
        (override) => override.action === "grant" && !auth.session.permissions.includes(override.permission)
      );
      if (outsideActor) {
        return NextResponse.json(
          { ok: false, message: "You can only grant permissions you already have." },
          { status: 403 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userPermissionOverride.deleteMany({ where: { userId: id } });
      if (body.overrides.length > 0) {
        await tx.userPermissionOverride.createMany({
          data: body.overrides.map((override) => ({
            userId: id,
            permission: override.permission,
            action: override.action,
            grantedBy: auth.session.userId ?? "system"
          })),
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update permissions." },
      { status: 400 }
    );
  }
}
