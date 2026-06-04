import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { createRoleCatalogEntry, listRoleCatalog, getRoleUsageCounts } from "@/lib/roles/catalog";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";
import { randomUUID } from 'crypto';

const createRoleSchema = z.object({
  label: z.string().min(2),
  departmentId: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  experienceLevel: z.string().optional().or(z.literal("")),
  requirements: z.string().optional(),
  permissions: z.array(z.string().refine((value) => APP_ACTIONS.includes(value as (typeof APP_ACTIONS)[number]))).optional()
});

const createAccessRoleSchema = z.object({
  label: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9_-]+$/),
  description: z.string().optional(),
  applicability: z.enum(['system', 'department', 'both']),
  permissions: z.array(z.string().refine((value) => APP_ACTIONS.includes(value as (typeof APP_ACTIONS)[number]))).optional()
});

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "job_designation";
  const departmentId = searchParams.get("departmentId") || undefined;

  // Access roles have special handling
  if (kind === "access_role") {
    // Check if user has role management permission (manage_users or create_role)
    const canManageRoles = auth.session.permissions?.includes("manage_users") ||
                          auth.session.permissions?.includes("create_role") ||
                          auth.session.permissions?.includes("edit_role");

    if (!canManageRoles) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const roles = await prisma.roleCatalog.findMany({
      where: { kind: "access_role", isActive: true },
      include: {
        permissions: { select: { permission: true } },
        _count: { select: { accessGrants: { where: { status: 'active' } } } }
      },
      orderBy: [{ applicability: 'desc' }, { label: 'asc' }]
    });

    return NextResponse.json(roles);
  }

  // Job designations use existing logic
  const roles = await listRoleCatalog(true, departmentId);

  const rolesWithCounts = await Promise.all(
    roles.map(async (role) => {
      const counts = await getRoleUsageCounts(role.id);
      return {
        id: role.id,
        label: role.label,
        departmentId: role.departmentId ?? "",
        department: role.department ?? "",
        departmentName: role.departmentName ?? role.department ?? "",
        description: role.description ?? "",
        experienceLevel: role.experienceLevel ?? "",
        requirements: role.requirements ?? "",
        permissions: role.permissions ?? [],
        isActive: role.isActive,
        openJobCount: counts.openJobCount,
        pipelineCandidateCount: counts.pipelineCandidateCount
      };
    })
  );

  return NextResponse.json({
    ok: true,
    roles: rolesWithCounts
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  const isAccessRole = body.applicability !== undefined;

  if (isAccessRole) {
    // Handle access role creation
    const permission = await requirePermission(auth.session, "create_role");
    if (!permission.ok) {
      return permission.response;
    }

    try {
      const validated = createAccessRoleSchema.parse(body);

      // Check slug uniqueness
      const existing = await prisma.roleCatalog.findUnique({
        where: { slug: validated.slug }
      });

      if (existing) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }

      // Create role
      const role = await prisma.roleCatalog.create({
        data: {
          id: randomUUID(),
          slug: validated.slug,
          label: validated.label,
          description: validated.description || null,
          kind: 'access_role',
          applicability: validated.applicability,
          departmentId: 'system',
          isActive: true
        }
      });

      // Add permissions
      if (validated.permissions && validated.permissions.length > 0) {
        await prisma.rolePermissionTemplate.createMany({
          data: validated.permissions.map((permission: string) => ({
            id: randomUUID(),
            roleId: role.id,
            permission
          }))
        });
      }

      const createdRole = await prisma.roleCatalog.findUnique({
        where: { id: role.id },
        include: {
          permissions: { select: { permission: true } },
          _count: { select: { accessGrants: { where: { status: 'active' } } } }
        }
      });

      return NextResponse.json(createdRole, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid request' },
        { status: 400 }
      );
    }
  }

  // Handle job designation creation
  const permission = await requirePermission(auth.session, "create_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const parsedBody = createRoleSchema.parse(body);
    if (parsedBody.permissions && auth.session.userId && !(await hasGlobalPermission(auth.session.userId, "create_role"))) {
      const outsideActor = parsedBody.permissions.find((permission) => !auth.session.permissions.includes(permission));
      if (outsideActor) {
        throw new Error("You can only create roles within your own permission set.");
      }
    }

    const role = await createRoleCatalogEntry({
      label: parsedBody.label,
      departmentId: parsedBody.departmentId || undefined,
      description: parsedBody.description,
      experienceLevel: parsedBody.experienceLevel || undefined,
      requirements: parsedBody.requirements,
      permissions: parsedBody.permissions
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
      { ok: false, message: error instanceof Error ? error.message : "Could not create role." },
      { status: 400 }
    );
  }
}
