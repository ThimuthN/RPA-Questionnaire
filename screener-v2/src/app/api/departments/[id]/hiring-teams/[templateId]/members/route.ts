import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createRequestLogContext, logRouteError, messageFromError } from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["owner", "recruiter", "hiring_manager", "interviewer", "reviewer", "final_approver"])
});

const removeMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["owner", "recruiter", "hiring_manager", "interviewer", "reviewer", "final_approver"])
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const logContext = createRequestLogContext(request, "api.hiring_teams.add_member");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId, templateId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const body = addMemberSchema.parse(await request.json());

    const template = await prisma.hiringTeamTemplate.findUnique({
      where: { id: templateId },
      select: { departmentId: true }
    });

    if (!template || template.departmentId !== departmentId) {
      throw new Error("Template not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    const existing = await prisma.hiringTeamTemplateMember.findUnique({
      where: {
        templateId_userId_role: {
          templateId,
          userId: body.userId,
          role: body.role
        }
      }
    });

    if (existing) {
      throw new Error("Member with this role already exists in this template");
    }

    const member = await prisma.hiringTeamTemplateMember.create({
      data: {
        templateId,
        userId: body.userId,
        role: body.role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ ok: true, member });
  } catch (error) {
    logRouteError("hiring_teams_add_member_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to add team member");
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const logContext = createRequestLogContext(request, "api.hiring_teams.remove_member");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId, templateId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const body = removeMemberSchema.parse(await request.json());

    const template = await prisma.hiringTeamTemplate.findUnique({
      where: { id: templateId },
      select: { departmentId: true }
    });

    if (!template || template.departmentId !== departmentId) {
      throw new Error("Template not found");
    }

    await prisma.hiringTeamTemplateMember.delete({
      where: {
        templateId_userId_role: {
          templateId,
          userId: body.userId,
          role: body.role
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logRouteError("hiring_teams_remove_member_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to remove team member");
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
