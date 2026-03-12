import { NextResponse } from "next/server";
import { z } from "zod";
import { submitAttempt } from "@/lib/db/repositories";

const submitSchema = z.object({
  practicalEarned: z.number().min(0).default(0),
  practicalPossible: z.number().min(0).default(0)
});

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    const body = submitSchema.parse(await request.json());
    const result = await submitAttempt({
      attemptId,
      practicalEarned: body.practicalEarned,
      practicalPossible: body.practicalPossible
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
