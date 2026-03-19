import { NextResponse } from "next/server";
import { z } from "zod";
import { patchAttempt } from "@/lib/db/repositories";

const autosaveSchema = z.object({
  stage: z.string().optional(),
  examState: z.record(z.string(), z.any()).optional(),
  sectionState: z.record(z.string(), z.any()).optional(),
  integrity: z
    .object({
      tabHiddenCount: z.number().int().min(0).optional(),
      copyCount: z.number().int().min(0).optional(),
      pasteCount: z.number().int().min(0).optional()
    })
    .optional()
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    const body = autosaveSchema.parse(await request.json());
    const updated = await patchAttempt(attemptId, body);
    if (!updated) {
      return NextResponse.json({ ok: false, message: "Attempt not found or already submitted." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      attemptId: updated.id,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}
