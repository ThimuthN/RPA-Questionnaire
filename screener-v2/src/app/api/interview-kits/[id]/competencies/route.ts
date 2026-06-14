import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { addCompetencyToKit } from "@/lib/db/interview-kits";

const addSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  anchors: z
    .object({
      "1": z.string().optional(),
      "3": z.string().optional(),
      "5": z.string().optional(),
    })
    .optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "manage_addons");
  if (!perm.ok) return perm.response;

  const { id: kitId } = await params;
  try {
    const body = addSchema.parse(await request.json());
    const competency = await addCompetencyToKit(kitId, body);
    return NextResponse.json({ ok: true, competency }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add competency";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
