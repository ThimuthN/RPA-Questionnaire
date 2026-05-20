import { NextResponse } from "next/server";
import { z } from "zod";
import { createAppUser } from "@/lib/auth/app-auth";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { isFormRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db/prisma";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  departmentId: z.string().optional(),
  roleId: z.string().optional()
});

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  if (!auth.session.permissions.includes("manage_users")) {
    return NextResponse.json({ ok: false, message: "Permission denied: manage_users" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      departmentId: true,
      roleId: true,
      isActive: true,
      dept: {
        select: {
          id: true,
          name: true
        }
      },
      role: {
        select: {
          id: true,
          label: true
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = userSchema.parse(rawBody);
    const permission = await requirePermissionForDepartment(auth.session, "manage_users", body.departmentId || null);
    if (!permission.ok) return permission.response;

    if (body.roleId) {
      const role = await prisma.roleCatalog.findUnique({
        where: { id: body.roleId },
        select: { departmentId: true }
      });
      if (!role) {
        throw new Error("Role not found.");
      }
      if (body.departmentId && role.departmentId !== body.departmentId) {
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

    const created = await createAppUser({
      ...body,
      actorId: auth.session.userId,
      actorEmail: auth.session.email
    });

    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("created", created.email);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true, user: created });
  } catch (error) {
    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("error", error instanceof Error ? error.message : "Could not create user.");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create user." },
      { status: 400 }
    );
  }
}
