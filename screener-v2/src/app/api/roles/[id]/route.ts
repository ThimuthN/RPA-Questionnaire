import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requireRoleManagePermission } from "@/lib/auth/guards";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  deleteRoleCatalogEntry,
  getRoleCatalogEntry,
  getRoleUsageCounts,
  updateRoleCatalogEntry
} from "@/lib/roles/catalog";

const jobDesignationSchema = z.object({
  label: z.string().min(2),
  departmentId: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  experienceLevel: z.string().optional().or(z.literal("")),
  requirements: z.string().optional(),
  isActive: z.boolean().default(true)
});

const accessRoleSchema = z.object({
  label: z.string().min(2).optional(),
  description: z.string().optional(),
  permissions: z
    .array(z.string().refine((value) => APP_ACTIONS.includes(value as (typeof APP_ACTIONS)[number])))
    .optional()
});

function jsonOk<T>(body: T, status = 200) {
  return NextResponse.json({ ok: true, ...body }, { status });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireRoleManagePermission(auth.session, "edit_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const currentRole = await prisma.roleCatalog.findUnique({
      where: { id },
      select: { id: true, kind: true, label: true }
    });

    if (!currentRole) {
      return jsonError("Role not found.", 404);
    }

    if (currentRole.kind === "access_role") {
      const validated = accessRoleSchema.parse(body);

      await prisma.$transaction(async (tx) => {
        await tx.roleCatalog.update({
          where: { id },
          data: {
            label: validated.label?.trim() || currentRole.label,
            description: validated.description !== undefined ? validated.description.trim() || null : undefined
          }
        });

        if (validated.permissions) {
          await tx.rolePermissionTemplate.deleteMany({ where: { roleId: id } });
          if (validated.permissions.length > 0) {
            await tx.rolePermissionTemplate.createMany({
              data: validated.permissions.map((permissionValue) => ({
                id: randomUUID(),
                roleId: id,
                permission: permissionValue
              }))
            });
          }
        }
      });

      const role = await getRoleCatalogEntry(id);
      if (!role) {
        return jsonError("Role not found.", 404);
      }

      return jsonOk({ role });
    }

    const validated = jobDesignationSchema.parse(body);
    const role = await updateRoleCatalogEntry(id, {
      label: validated.label,
      departmentId: validated.departmentId || undefined,
      description: validated.description,
      experienceLevel: validated.experienceLevel || undefined,
      requirements: validated.requirements,
      isActive: validated.isActive
    });

    return jsonOk({ role: { ...role, permissions: [] } });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not update role.");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireRoleManagePermission(auth.session, "delete_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const deleteMode = body.mode === "delete" ? "delete" : "deactivate";

    const role = await prisma.roleCatalog.findUnique({
      where: { id },
      select: { id: true, kind: true }
    });

    if (!role) {
      return jsonError("Role not found.", 404);
    }

    if (role.kind === "access_role") {
      const activeGrantCount = await prisma.accessGrant.count({
        where: { roleId: id, status: "active" }
      });

      if (deleteMode === "deactivate") {
        await prisma.$transaction([
          prisma.roleCatalog.update({
            where: { id },
            data: { isActive: false }
          }),
          prisma.accessGrant.updateMany({
            where: { roleId: id, status: "active" },
            data: { status: "inactive" }
          })
        ]);

        return jsonOk({ message: "Role deactivated." });
      }

      if (activeGrantCount > 0) {
        return jsonError(`Cannot delete role with ${activeGrantCount} active grant(s). Deactivate it first.`, 409);
      }

      await prisma.roleCatalog.delete({ where: { id } });
      return jsonOk({ message: "Role deleted." });
    }

    const { openJobCount, pipelineCandidateCount } = await getRoleUsageCounts(id);
    if (openJobCount > 0) {
      return jsonError(
        `This job designation is linked to ${openJobCount} open job posting(s). Close or reassign them first.`,
        409
      );
    }

    if (pipelineCandidateCount > 0) {
      return jsonError(
        `This job designation is assigned to ${pipelineCandidateCount} active pipeline candidate(s). Reassign them first.`,
        409
      );
    }

    await deleteRoleCatalogEntry(id);
    return jsonOk({ message: "Job designation deleted." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not delete role.");
  }
}
