import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiSession } from "@/lib/auth/guards";
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
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId } = await params;

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

    // Verify role exists and belongs to this department
    const role = await prisma.roleCatalog.findUnique({
      where: { id: body.roleId },
      select: { id: true, departmentId: true }
    });
    if (!role) {
      return NextResponse.json(
        { ok: false, message: "Role not found" },
        { status: 404 }
      );
    }
    if (role.departmentId !== departmentId) {
      return NextResponse.json(
        { ok: false, message: "Role does not belong to this department" },
        { status: 400 }
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
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId } = await params;

  try {
    const body = removeUserSchema.parse(await request.json());

    // Verify user exists and belongs to this department
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
    if (user.departmentId !== departmentId) {
      return NextResponse.json(
        { ok: false, message: "User does not belong to this department" },
        { status: 400 }
      );
    }

    // Remove user from department and role
    await prisma.user.update({
      where: { id: body.userId },
      data: {
        departmentId: null,
        roleId: null
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
      { ok: false, message: error instanceof Error ? error.message : "Failed to remove user" },
      { status: 500 }
    );
  }
}
