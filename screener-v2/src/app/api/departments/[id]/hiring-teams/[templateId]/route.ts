import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createRequestLogContext, logRouteError, messageFromError } from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const logContext = createRequestLogContext(request, "api.hiring_teams.update");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId, templateId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const body = updateTemplateSchema.parse(await request.json());

    const template = await prisma.hiringTeamTemplate.findUnique({
      where: { id: templateId },
      select: { departmentId: true }
    });

    if (!template || template.departmentId !== departmentId) {
      throw new Error("Template not found");
    }

    const updated = await prisma.hiringTeamTemplate.update({
      where: { id: templateId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ ok: true, template: updated });
  } catch (error) {
    logRouteError("hiring_teams_update_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to update hiring team template");
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const logContext = createRequestLogContext(request, "api.hiring_teams.delete");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId, templateId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const template = await prisma.hiringTeamTemplate.findUnique({
      where: { id: templateId },
      select: { departmentId: true }
    });

    if (!template || template.departmentId !== departmentId) {
      throw new Error("Template not found");
    }

    await prisma.hiringTeamTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logRouteError("hiring_teams_delete_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to delete hiring team template");
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
