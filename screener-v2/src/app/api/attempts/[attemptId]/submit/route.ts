import { NextResponse } from "next/server";
import { z } from "zod";
import { submitAttempt } from "@/lib/db/repositories";

const submitSchema = z.object({
  practicalEarned: z.number().min(0).optional(),
  practicalPossible: z.number().min(0).optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    const body = await request.json().catch(() => ({}));
    submitSchema.parse(body);
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
