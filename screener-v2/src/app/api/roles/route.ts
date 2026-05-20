import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { createRoleCatalogEntry, listRoleCatalog, getRoleUsageCounts } from "@/lib/roles/catalog";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import { hasGlobalPermission } from "@/lib/auth/permission-evaluator";

const createRoleSchema = z.object({
  label: z.string().min(2),
  departmentId: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  experienceLevel: z.string().optional().or(z.literal("")),
  requirements: z.string().optional(),
  permissions: z.array(z.string().refine((value) => APP_ACTIONS.includes(value as (typeof APP_ACTIONS)[number]))).optional()
});

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId") || undefined;

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
  const permission = await requirePermission(auth.session, "create_role");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const body = createRoleSchema.parse(await request.json());
    if (body.permissions && auth.session.userId && !(await hasGlobalPermission(auth.session.userId, "create_role"))) {
      const outsideActor = body.permissions.find((permission) => !auth.session.permissions.includes(permission));
      if (outsideActor) {
        throw new Error("You can only create roles within your own permission set.");
      }
    }

    const role = await createRoleCatalogEntry({
      label: body.label,
      departmentId: body.departmentId || undefined,
      description: body.description,
      experienceLevel: body.experienceLevel || undefined,
      requirements: body.requirements,
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
      { ok: false, message: error instanceof Error ? error.message : "Could not create role." },
      { status: 400 }
    );
  }
}
