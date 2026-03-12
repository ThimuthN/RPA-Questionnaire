import { NextResponse } from "next/server";
import { getResult } from "@/lib/db/repositories";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await context.params;
  const row = await getResult(attemptId);
  if (!row) {
    return NextResponse.json({ ok: false, message: "Result not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, row });
}
