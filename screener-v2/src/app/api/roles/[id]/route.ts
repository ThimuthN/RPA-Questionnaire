import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { updateRoleCatalogEntry, getRoleUsageCounts, deleteRoleCatalogEntry } from "@/lib/roles/catalog";

const updateRoleSchema = z.object({
  label: z.string().min(2),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  isActive: z.boolean().default(true)
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = updateRoleSchema.parse(await request.json());
    const role = await updateRoleCatalogEntry(id, {
      label: body.label,
      department: body.department || undefined,
      isActive: body.isActive
    });

    return NextResponse.json({
      ok: true,
      role: {
        id: role.id,
        label: role.label,
        department: role.department ?? "",
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
