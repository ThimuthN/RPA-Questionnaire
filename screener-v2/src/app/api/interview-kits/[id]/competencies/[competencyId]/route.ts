import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { deleteCompetency, updateCompetency } from "@/lib/db/interview-kits";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().nullable().optional(),
  anchors: z
    .object({
      "1": z.string().optional(),
      "3": z.string().optional(),
      "5": z.string().optional(),
    })
    .optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ competencyId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "manage_addons");
  if (!perm.ok) return perm.response;

  const { competencyId } = await params;
  try {
    const body = updateSchema.parse(await request.json());
    const competency = await updateCompetency(competencyId, body);
    return NextResponse.json({ ok: true, competency });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update competency";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ competencyId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "manage_addons");
  if (!perm.ok) return perm.response;

  const { competencyId } = await params;
  try {
    await deleteCompetency(competencyId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to delete competency" }, { status: 400 });
  }
}
