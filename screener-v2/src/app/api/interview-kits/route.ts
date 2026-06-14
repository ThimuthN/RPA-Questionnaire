import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { createInterviewKit, listInterviewKits } from "@/lib/db/interview-kits";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  isGlobal: z.boolean().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId") ?? undefined;

  const kits = await listInterviewKits(departmentId);
  return NextResponse.json({ kits });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "manage_addons");
  if (!perm.ok) return perm.response;

  try {
    const body = createSchema.parse(await request.json());
    const kit = await createInterviewKit({ ...body, createdById: auth.session.userId ?? undefined });
    return NextResponse.json({ ok: true, kit }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create kit";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
