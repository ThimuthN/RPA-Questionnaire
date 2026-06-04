import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requireRoleManagePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getRoleCatalogEntry } from "@/lib/roles/catalog";

const duplicateSchema = z.object({
  label: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9_-]+$/)
});

function jsonOk<T>(body: T, status = 200) {
  return NextResponse.json({ ok: true, ...body }, { status });
}

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

async function suggestDuplicateSlug(baseSlug: string) {
  let nextIndex = 2;

  while (true) {
    const suggestedSlug = `${baseSlug}-copy-${nextIndex}`;
    const existing = await prisma.roleCatalog.findUnique({
      where: { slug: suggestedSlug },
      select: { id: true }
    });

    if (!existing) {
      return suggestedSlug;
    }

    nextIndex += 1;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireRoleManagePermission(auth.session, "create_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const { id } = await params;
    const body = duplicateSchema.parse(await request.json());

    const sourceRole = await prisma.roleCatalog.findUnique({
      where: { id },
      include: {
        permissions: {
          select: { permission: true }
        }
      }
    });

    if (!sourceRole) {
      return jsonError("Source role not found.", 404);
    }

    const existing = await prisma.roleCatalog.findUnique({
      where: { slug: body.slug },
      select: { id: true }
    });

    if (existing) {
      const suggestedSlug = await suggestDuplicateSlug(sourceRole.slug);
      return jsonError(`Slug already exists. Try ${suggestedSlug}.`, 409, { suggestedSlug });
    }

    const duplicatedRoleId = await prisma.$transaction(async (tx) => {
      const role = await tx.roleCatalog.create({
        data: {
          id: randomUUID(),
          slug: body.slug,
          label: body.label.trim(),
          description: sourceRole.description,
          kind: sourceRole.kind,
          applicability: sourceRole.applicability,
          departmentId: sourceRole.departmentId,
          experienceLevel: sourceRole.experienceLevel,
          requirements: sourceRole.requirements,
          isActive: true
        }
      });

      if (sourceRole.kind === "access_role" && sourceRole.permissions.length > 0) {
        await tx.rolePermissionTemplate.createMany({
          data: sourceRole.permissions.map((permissionValue) => ({
            id: randomUUID(),
            roleId: role.id,
            permission: permissionValue.permission
          }))
        });
      }

      return role.id;
    });

    const role = await getRoleCatalogEntry(duplicatedRoleId);
    if (!role) {
      throw new Error("Duplicated role could not be loaded.");
    }

    return jsonOk({ role, message: "Role duplicated." }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to duplicate role.", 500);
  }
}
