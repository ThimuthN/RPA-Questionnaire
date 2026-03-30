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
  expectedStateVersion: z.number().int().min(0).optional(),
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
    if (updated.status === "missing") {
      return NextResponse.json({ ok: false, message: "Attempt not found." }, { status: 404 });
    }
    if (updated.status === "conflict" || updated.status === "submitted") {
      const timers = Object.fromEntries(
        Object.entries(updated.attempt.examState ?? {}).map(([instanceId, state]) => [
          instanceId,
          state?.remainingSeconds ?? 0
        ])
      );

      return NextResponse.json(
        {
          ok: false,
          code: updated.status === "submitted" ? "attempt_submitted" : "version_conflict",
          message:
            updated.status === "submitted"
              ? "Attempt already submitted."
              : "Attempt has newer saved changes.",
          stateVersion: updated.attempt.stateVersion,
          stage: updated.attempt.stage,
          timers,
          integrity: updated.attempt.integrity
        },
        { status: 409 }
      );
    }

    const timers = Object.fromEntries(
      Object.entries(updated.attempt.examState ?? {}).map(([instanceId, state]) => [
        instanceId,
        state?.remainingSeconds ?? 0
      ])
    );
    return NextResponse.json({
      ok: true,
      attemptId: updated.attempt.id,
      savedAt: new Date().toISOString(),
      stage: updated.attempt.stage,
      timers,
      integrity: updated.attempt.integrity,
      stateVersion: updated.attempt.stateVersion
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
