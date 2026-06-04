import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requireRoleManagePermission } from "@/lib/auth/guards";
import { isSystemAdmin } from "@/lib/auth/permission-evaluator";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  createRoleCatalogEntry,
  getRoleCatalogEntry,
  getRoleUsageCounts,
  listAccessRoles,
  listRoleCatalog,
  type RoleApplicability
} from "@/lib/roles/catalog";

const jobDesignationSchema = z.object({
  label: z.string().min(2),
  departmentId: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  experienceLevel: z.string().optional().or(z.literal("")),
  requirements: z.string().optional()
});

const accessRoleSchema = z.object({
  kind: z.literal("access_role").optional(),
  label: z.string().min(2, "Role name must be at least 2 characters."),
  slug: z.string().regex(/^[a-z0-9_-]+$/, "Slug must use only lowercase letters, numbers, hyphens, and underscores."),
  departmentId: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  applicability: z.enum(["system", "department", "both"]),
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

function zodErrorMessage(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Invalid request.";
  const field = first.path.length > 0 ? first.path.join(".") : undefined;
  return field ? `${field}: ${first.message}` : first.message;
}

async function resolveSystemDepartmentId() {
  const systemDepartment = await prisma.department.findUnique({
    where: { slug: "system" },
    select: { id: true }
  });

  if (!systemDepartment) {
    throw new Error("System department not found.");
  }

  return systemDepartment.id;
}

async function resolveAccessRoleOwnerDepartmentId(inputDepartmentId?: string, applicability?: RoleApplicability) {
  const systemDepartmentId = await resolveSystemDepartmentId();
  const requestedDepartmentId = inputDepartmentId?.trim() || undefined;

  if (!requestedDepartmentId) {
    return systemDepartmentId;
  }

  const department = await prisma.department.findUnique({
    where: { id: requestedDepartmentId },
    select: { id: true }
  });

  if (!department) {
    throw new Error("Department not found.");
  }

  if (applicability === "system" && requestedDepartmentId !== systemDepartmentId) {
    throw new Error("System-only access roles must be owned by the System department.");
  }

  return requestedDepartmentId;
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") === "access_role" ? "access_role" : "job_designation";
  const departmentId = searchParams.get("departmentId") || undefined;
  const scope = searchParams.get("scope");
  const normalizedScope = scope === "system" || scope === "department" ? scope : undefined;

  if (kind === "access_role") {
    const sysAdmin = auth.session.userId ? await isSystemAdmin(auth.session.userId) : false;
    const canManageRoles =
      sysAdmin ||
      auth.session.permissions?.includes("manage_users") ||
      auth.session.permissions?.includes("create_role") ||
      auth.session.permissions?.includes("edit_role");

    if (!canManageRoles) {
      return jsonError("Permission denied.", 403);
    }

    const roles = await listAccessRoles({
      departmentId,
      scope: normalizedScope,
      includeInactive: false
    });

    return jsonOk({ roles });
  }

  const roles = await listRoleCatalog(true, departmentId, "job_designation");
  const rolesWithCounts = await Promise.all(
    roles.map(async (role) => {
      const counts = await getRoleUsageCounts(role.id);
      return {
        ...role,
        permissions: [],
        openJobCount: counts.openJobCount,
        pipelineCandidateCount: counts.pipelineCandidateCount
      };
    })
  );

  return jsonOk({ roles: rolesWithCounts });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json();
  const isAccessRole = body.kind === "access_role" || body.applicability !== undefined;
  const permission = await requireRoleManagePermission(auth.session, "create_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    if (isAccessRole) {
      const validated = accessRoleSchema.parse(body);
      const departmentId = await resolveAccessRoleOwnerDepartmentId(
        validated.departmentId || undefined,
        validated.applicability
      );

      const existing = await prisma.roleCatalog.findUnique({
        where: { slug: validated.slug }
      });
      if (existing) {
        return jsonError("Slug already exists.", 409);
      }

      const created = await prisma.$transaction(async (tx) => {
        const role = await tx.roleCatalog.create({
          data: {
            id: randomUUID(),
            slug: validated.slug,
            label: validated.label.trim(),
            description: validated.description?.trim() || null,
            kind: "access_role",
            applicability: validated.applicability,
            departmentId,
            isActive: true
          }
        });

        if (validated.permissions?.length) {
          await tx.rolePermissionTemplate.createMany({
            data: validated.permissions.map((permissionValue) => ({
              id: randomUUID(),
              roleId: role.id,
              permission: permissionValue
            }))
          });
        }

        return role.id;
      });

      const role = await getRoleCatalogEntry(created);
      if (!role) {
        throw new Error("Created role could not be loaded.");
      }

      return jsonOk({ role }, 201);
    }

    const validated = jobDesignationSchema.parse(body);
    const role = await createRoleCatalogEntry({
      label: validated.label,
      departmentId: validated.departmentId || undefined,
      description: validated.description,
      experienceLevel: validated.experienceLevel || undefined,
      requirements: validated.requirements
    });

    return jsonOk({ role: { ...role, permissions: [] } }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(zodErrorMessage(error));
    }
    return jsonError(error instanceof Error ? error.message : "Invalid request.");
  }
}
