import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { isFormRequest } from "@/lib/http/request";
import { updateAppUser, deactivateAppUser, reactivateAppUser } from "@/lib/auth/app-auth";
import { prisma } from "@/lib/db/prisma";
import { validateAssignableAccessRole } from "@/lib/auth/access-roles";

const updateUserSchema = z.object({
  action: z.enum(["update", "deactivate", "reactivate"]).default("update"),
  name: z.string().optional(),
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional()
}).describe("When changing departmentId without providing a roleId, the user's role is automatically cleared to require explicit assignment in the new department");

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
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = updateUserSchema.parse(rawBody);

    const current = await prisma.user.findUnique({
      where: { id },
      select: { departmentId: true }
    });
    if (!current) {
      throw new Error("User not found.");
    }
    const targetDepartmentId = body.departmentId ?? current.departmentId;
    const permission = await requirePermissionForDepartment(auth.session, "manage_users", targetDepartmentId);
    if (!permission.ok) return permission.response;

    if (body.roleId) {
      const validation = await validateAssignableAccessRole(body.roleId, targetDepartmentId, auth.session);
      if (!validation.ok) {
        if (isFormRequest(request)) {
          const url = new URL("/departments", request.url);
          url.searchParams.set("error", validation.message);
          return NextResponse.redirect(url, 303);
        }
        return NextResponse.json(
          { ok: false, message: validation.message },
          { status: validation.status }
        );
      }
    }

    if (body.action === "deactivate") {
      if (auth.session.userId === id) {
        throw new Error("Cannot deactivate your own account.");
      }
      await deactivateAppUser(id, {
        actorId: auth.session.userId,
        actorEmail: auth.session.email
      });
    } else if (body.action === "reactivate") {
      await reactivateAppUser(id, {
        actorId: auth.session.userId,
        actorEmail: auth.session.email
      });
    } else {
      await updateAppUser({
        userId: id,
        name: body.name,
        departmentId: body.departmentId,
        roleId: body.roleId,
        isActive: body.isActive,
        actorId: auth.session.userId,
        actorEmail: auth.session.email
      });
    }

    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("updated", id);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("error", error instanceof Error ? error.message : "Could not update user.");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update user." },
      { status: 400 }
    );
  }
}
