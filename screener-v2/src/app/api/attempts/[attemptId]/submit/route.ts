import { NextResponse } from "next/server";
import { submitAttempt } from "@/lib/db/repositories";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    await request.json().catch(() => ({}));
    const result = await submitAttempt({
      attemptId
    });
    if (!result) {
      return NextResponse.json({ ok: false, message: "Attempt not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}
