import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { updateRoleCatalogEntry, getRoleUsageCounts, deleteRoleCatalogEntry } from "@/lib/roles/catalog";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";

const updateRoleSchema = z.object({
  label: z.string().min(2),
  departmentId: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  experienceLevel: z.string().optional().or(z.literal("")),
  requirements: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string().refine((value) => APP_ACTIONS.includes(value as (typeof APP_ACTIONS)[number]))).optional()
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const permission = await requirePermission(auth.session, "edit_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const { id } = await params;
    const body = updateRoleSchema.parse(await request.json());
    if (body.permissions && auth.session.userId && !(await hasGlobalPermission(auth.session.userId, "edit_role"))) {
      const outsideActor = body.permissions.find((permission) => !auth.session.permissions.includes(permission));
      if (outsideActor) {
        throw new Error("You can only edit roles within your own permission set.");
      }
    }

    const role = await updateRoleCatalogEntry(id, {
      label: body.label,
      departmentId: body.departmentId || undefined,
      description: body.description,
      experienceLevel: body.experienceLevel || undefined,
      requirements: body.requirements,
      isActive: body.isActive,
      permissions: body.permissions
    });

    return NextResponse.json({
      ok: true,
      role: {
        id: role.id,
        label: role.label,
        departmentId: role.departmentId ?? "",
        departmentName: role.departmentName ?? "",
        description: role.description ?? "",
        experienceLevel: role.experienceLevel ?? "",
        requirements: role.requirements ?? "",
        permissions: role.permissions ?? [],
        isActive: role.isActive
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update role." },
      { status: 400 }
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
  const permission = await requirePermission(auth.session, "delete_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const { id } = await params;

    const { openJobCount, pipelineCandidateCount } = await getRoleUsageCounts(id);

    if (openJobCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `This role is linked to ${openJobCount} open job posting(s). Close or reassign them first.`
        },
        { status: 409 }
      );
    }

    if (pipelineCandidateCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `This role is assigned to ${pipelineCandidateCount} active pipeline candidate(s). Reassign them first.`
        },
        { status: 409 }
      );
    }

    await deleteRoleCatalogEntry(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not delete role." },
      { status: 400 }
    );
  }
}
