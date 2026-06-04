import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { updateRoleCatalogEntry, getRoleUsageCounts, deleteRoleCatalogEntry } from "@/lib/roles/catalog";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";
import { randomUUID } from 'crypto';

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
    const body = await request.json();

    // Check if this is an access role
    const role = await prisma.roleCatalog.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.kind === 'access_role') {
      // Handle access role update
      const { label, description, permissions } = body;

      await prisma.roleCatalog.update({
        where: { id },
        data: {
          label: label || role.label,
          description: description !== undefined ? description : role.description
        }
      });

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await prisma.rolePermissionTemplate.deleteMany({ where: { roleId: id } });
        await prisma.rolePermissionTemplate.createMany({
          data: permissions.map((permission: string) => ({
            id: randomUUID(),
            roleId: id,
            permission
          }))
        });
      }

      const updatedRole = await prisma.roleCatalog.findUnique({
        where: { id },
        include: {
          permissions: { select: { permission: true } },
          _count: { select: { accessGrants: { where: { status: 'active' } } } }
        }
      });

      return NextResponse.json(updatedRole);
    }

    // Handle job designation update (existing logic)
    const parsedBody = updateRoleSchema.parse(body);
    if (parsedBody.permissions && auth.session.userId && !(await hasGlobalPermission(auth.session.userId, "edit_role"))) {
      const outsideActor = parsedBody.permissions.find((permission) => !auth.session.permissions.includes(permission));
      if (outsideActor) {
        throw new Error("You can only edit roles within your own permission set.");
      }
    }

    const updatedRole = await updateRoleCatalogEntry(id, {
      label: parsedBody.label,
      departmentId: parsedBody.departmentId || undefined,
      description: parsedBody.description,
      experienceLevel: parsedBody.experienceLevel || undefined,
      requirements: parsedBody.requirements,
      isActive: parsedBody.isActive,
      permissions: parsedBody.permissions
    });

    return NextResponse.json({
      ok: true,
      role: {
        id: updatedRole.id,
        label: updatedRole.label,
        departmentId: updatedRole.departmentId ?? "",
        departmentName: updatedRole.departmentName ?? "",
        description: updatedRole.description ?? "",
        experienceLevel: updatedRole.experienceLevel ?? "",
        requirements: updatedRole.requirements ?? "",
        permissions: updatedRole.permissions ?? [],
        isActive: updatedRole.isActive
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
    const body = await request.json();
    const deleteMode = body.mode || 'deactivate';

    const role = await prisma.roleCatalog.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.kind === 'access_role') {
      // Handle access role deletion/deactivation
      const activeGrants = await prisma.accessGrant.count({
        where: { roleId: id, status: 'active' }
      });

      if (deleteMode === 'deactivate') {
        // Deactivate the role
        await prisma.roleCatalog.update({
          where: { id },
          data: { isActive: false }
        });

        // Deactivate all active grants
        await prisma.accessGrant.updateMany({
          where: { roleId: id, status: 'active' },
          data: { status: 'inactive' }
        });

        return NextResponse.json({ message: 'Role deactivated' });
      } else if (deleteMode === 'delete') {
        // Hard delete (only if no active grants)
        if (activeGrants > 0) {
          return NextResponse.json(
            { error: `Cannot delete role with ${activeGrants} active grant(s). Deactivate first.` },
            { status: 409 }
          );
        }

        await prisma.roleCatalog.delete({ where: { id } });
        return NextResponse.json({ message: 'Role deleted' });
      }

      return NextResponse.json({ error: 'Invalid deletion mode' }, { status: 400 });
    }

    // Handle job designation deletion (existing logic)
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
