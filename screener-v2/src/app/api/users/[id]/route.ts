import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { isFormRequest } from "@/lib/http/request";
import { updateAppUser, deactivateAppUser, reactivateAppUser } from "@/lib/auth/app-auth";
import { prisma } from "@/lib/db/prisma";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";

const updateUserSchema = z.object({
  action: z.enum(["update", "deactivate", "reactivate"]).default("update"),
  name: z.string().optional(),
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional()
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
      const role = await prisma.roleCatalog.findUnique({
        where: { id: body.roleId },
        select: { departmentId: true }
      });
      if (!role) {
        throw new Error("Role not found.");
      }
      if (targetDepartmentId && role.departmentId !== targetDepartmentId) {
        throw new Error("Role must belong to the selected department.");
      }
      if (auth.session.userId && !(await hasGlobalPermission(auth.session.userId, "manage_users"))) {
        const rolePermissions = await prisma.rolePermissionTemplate.findMany({
          where: { roleId: body.roleId },
          select: { permission: true }
        });
        if (rolePermissions.some((rolePermission) => !auth.session.permissions.includes(rolePermission.permission))) {
          throw new Error("You can only assign roles within your own permission set.");
        }
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
      const url = new URL("/users", request.url);
      url.searchParams.set("updated", id);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isFormRequest(request)) {
      const url = new URL("/users", request.url);
      url.searchParams.set("error", error instanceof Error ? error.message : "Could not update user.");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update user." },
      { status: 400 }
    );
  }
}
