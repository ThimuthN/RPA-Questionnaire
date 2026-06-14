import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { attachKitToJob, getKitsForJob } from "@/lib/db/interview-kits";

const attachSchema = z.object({
  kitId: z.string().min(1),
  milestoneType: z.string().default("interview"),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id: jobPostingId } = await params;
  const attachments = await getKitsForJob(jobPostingId);
  return NextResponse.json({ attachments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "edit_job");
  if (!perm.ok) return perm.response;

  const { id: jobPostingId } = await params;
  try {
    const body = attachSchema.parse(await request.json());
    await attachKitToJob(jobPostingId, body.kitId, body.milestoneType);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to attach kit";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
