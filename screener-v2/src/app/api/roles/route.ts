import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { createRoleCatalogEntry, listRoleCatalog } from "@/lib/roles/catalog";

const createRoleSchema = z.object({
  label: z.string().min(2),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  coreBasisRoleId: z.enum(["Intern", "Associate", "SE", "SeniorSE", "TechLead"]).default("Associate")
});

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const roles = await listRoleCatalog(true);
  return NextResponse.json({
    ok: true,
    roles: roles.map((role) => ({
      id: role.id,
      label: role.label,
      department: role.department ?? "",
      isActive: role.isActive,
      coreBasisRoleId: role.coreBasisRoleId
    }))
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = createRoleSchema.parse(await request.json());
    const role = await createRoleCatalogEntry({
      label: body.label,
      department: body.department || undefined,
      coreBasisRoleId: body.coreBasisRoleId
    });

    return NextResponse.json({
      ok: true,
      role: {
        id: role.id,
        label: role.label,
        department: role.department ?? "",
        isActive: role.isActive,
        coreBasisRoleId: role.coreBasisRoleId
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create role." },
      { status: 400 }
    );
  }
}
