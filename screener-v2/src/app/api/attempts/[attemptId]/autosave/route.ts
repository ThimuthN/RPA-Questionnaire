import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRuntimeAttemptApiAccess } from "@/lib/auth/guards";
import { patchAttempt } from "@/lib/db/repositories";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

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
  const logContext = createRequestLogContext(request, "api.attempts.autosave");

  try {
    const { attemptId } = await context.params;
    const auth = await requireRuntimeAttemptApiAccess(attemptId);
    if (!auth.ok) {
      return auth.response;
    }
    const body = autosaveSchema.parse(await request.json());
    const updated = await patchAttempt(attemptId, body);
    if (!updated) {
      return NextResponse.json({ ok: false, message: "Attempt not found or already submitted." }, { status: 404 });
    }
    const timers = Object.fromEntries(
      Object.entries(updated.examState ?? {}).map(([instanceId, state]) => [
        instanceId,
        state?.remainingSeconds ?? 0
      ])
    );
    return NextResponse.json({
      ok: true,
      attemptId: updated.id,
      savedAt: new Date().toISOString(),
      stage: updated.stage,
      timers,
      integrity: updated.integrity
    });
  } catch (error) {
    logRouteError("attempt_autosave_failed", logContext, error);

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Invalid request."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}
