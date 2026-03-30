import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/app-session";
import { getResult } from "@/lib/db/repositories";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  if (!(await getAppSession())) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const { attemptId } = await context.params;
  const row = await getResult(attemptId);
  if (!row) {
    return NextResponse.json({ ok: false, message: "Result not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, row });
}
