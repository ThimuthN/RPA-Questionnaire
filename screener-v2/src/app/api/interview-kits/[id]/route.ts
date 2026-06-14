import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { deleteInterviewKit, getInterviewKit, updateInterviewKit } from "@/lib/db/interview-kits";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().nullable().optional(),
  isGlobal: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const kit = await getInterviewKit(id);
  if (!kit) return NextResponse.json({ ok: false, message: "Kit not found" }, { status: 404 });
  return NextResponse.json({ kit });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "manage_addons");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  try {
    const body = updateSchema.parse(await request.json());
    const kit = await updateInterviewKit(id, body);
    if (!kit) return NextResponse.json({ ok: false, message: "Kit not found" }, { status: 404 });
    return NextResponse.json({ ok: true, kit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update kit";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "manage_addons");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  try {
    await deleteInterviewKit(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to delete kit" }, { status: 400 });
  }
}
