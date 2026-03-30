import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { getResult } from "@/lib/db/repositories";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { attemptId } = await context.params;
  const row = await getResult(attemptId);
  if (!row) {
    return NextResponse.json({ ok: false, message: "Result not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, row });
}
