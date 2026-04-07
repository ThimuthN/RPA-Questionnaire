import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRuntimeAttemptApiAccess } from "@/lib/auth/guards";
import { submitAttempt } from "@/lib/db/repositories";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

const submitSchema = z.object({
  expectedStateVersion: z.number().int().min(0).optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const logContext = createRequestLogContext(request, "api.attempts.submit");

  try {
    const { attemptId } = await context.params;
    const auth = await requireRuntimeAttemptApiAccess(attemptId);
    if (!auth.ok) {
      return auth.response;
    }
    const body = submitSchema.parse(await request.json().catch(() => ({})));
    const result = await submitAttempt({
      attemptId,
      expectedStateVersion: body.expectedStateVersion
    });
    if (result.status === "missing") {
      return NextResponse.json({ ok: false, message: "Attempt not found." }, { status: 404 });
    }
    if (result.status === "conflict") {
      const timers = Object.fromEntries(
        Object.entries(result.attempt.examState ?? {}).map(([instanceId, state]) => [
          instanceId,
          state?.remainingSeconds ?? 0
        ])
      );

      return NextResponse.json(
        {
          ok: false,
          code: "version_conflict",
          message: "Attempt has newer saved changes.",
          stateVersion: result.attempt.stateVersion,
          stage: result.attempt.stage,
          timers,
          integrity: result.attempt.integrity
        },
        { status: 409 }
      );
    }
    return NextResponse.json({
      ok: true,
      stage: "submitted",
      stateVersion: result.attempt.stateVersion
    });
  } catch (error) {
    logRouteError("attempt_submit_failed", logContext, error);

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
