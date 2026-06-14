import { NextResponse } from "next/server";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { detachKitFromJob } from "@/lib/db/interview-kits";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const perm = await requirePermission(auth.session, "edit_job");
  if (!perm.ok) return perm.response;

  const { attachmentId } = await params;
  try {
    await detachKitFromJob(attachmentId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to detach kit" }, { status: 400 });
  }
}
