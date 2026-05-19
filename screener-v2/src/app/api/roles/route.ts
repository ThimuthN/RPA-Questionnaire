import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { createRoleCatalogEntry, listRoleCatalog, getRoleUsageCounts } from "@/lib/roles/catalog";

const createRoleSchema = z.object({
  label: z.string().min(2),
  departmentId: z.string().optional().or(z.literal(""))
});

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");

  let roles = await listRoleCatalog(true);
  if (departmentId) {
    roles = roles.filter(role => role.departmentId === departmentId);
  }

  const rolesWithCounts = await Promise.all(
    roles.map(async (role) => {
      const counts = await getRoleUsageCounts(role.id);
      return {
        id: role.id,
        label: role.label,
        departmentId: role.departmentId ?? "",
        department: role.department ?? "",
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
    const role = await createRoleCatalogEntry({
      label: body.label,
      departmentId: body.departmentId || undefined
    });

    return NextResponse.json({
      ok: true,
      role: {
        id: role.id,
        label: role.label,
        departmentId: role.departmentId ?? "",
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
