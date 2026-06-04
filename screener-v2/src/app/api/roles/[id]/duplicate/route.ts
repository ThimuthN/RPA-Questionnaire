import { NextResponse } from "next/server";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requirePermission(auth.session, "create_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { label, slug } = body;

    if (!label || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sourceRole = await prisma.roleCatalog.findUnique({
      where: { id },
      include: { permissions: { select: { permission: true } } }
    });

    if (!sourceRole) {
      return NextResponse.json({ error: 'Source role not found' }, { status: 404 });
    }

    // Check slug uniqueness
    const existing = await prisma.roleCatalog.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Create duplicated role
    const newRoleId = randomUUID();
    const newRole = await prisma.roleCatalog.create({
      data: {
        id: newRoleId,
        slug,
        label,
        description: sourceRole.description,
        kind: sourceRole.kind,
        applicability: sourceRole.applicability,
        departmentId: sourceRole.departmentId,
        isActive: true
      }
    });

    // Copy permissions
    if (sourceRole.permissions.length > 0) {
      await prisma.rolePermissionTemplate.createMany({
        data: sourceRole.permissions.map(p => ({
          id: randomUUID(),
          roleId: newRoleId,
          permission: p.permission
        }))
      });
    }

    const duplicatedRole = await prisma.roleCatalog.findUnique({
      where: { id: newRoleId },
      include: {
        permissions: { select: { permission: true } },
        _count: { select: { accessGrants: { where: { status: 'active' } } } }
      }
    });

    return NextResponse.json(duplicatedRole, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate role' },
      { status: 500 }
    );
  }
}
