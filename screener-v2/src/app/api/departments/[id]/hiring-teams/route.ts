import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createRequestLogContext, logRouteError, messageFromError } from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logContext = createRequestLogContext(request, "api.hiring_teams.list");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const templates = await prisma.hiringTeamTemplate.findMany({
      where: { departmentId, isActive: true },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { role: "asc" }
        }
      },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ ok: true, templates });
  } catch (error) {
    logRouteError("hiring_teams_list_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to list hiring team templates");
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logContext = createRequestLogContext(request, "api.hiring_teams.create");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: departmentId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const body = createTemplateSchema.parse(await request.json());

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true }
    });

    if (!dept) {
      throw new Error("Department not found");
    }

    const template = await prisma.hiringTeamTemplate.create({
      data: {
        departmentId,
        name: body.name,
        description: body.description,
        sortOrder: 0
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

    return NextResponse.json({ ok: true, template });
  } catch (error) {
    logRouteError("hiring_teams_create_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to create hiring team template");
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
