import { NextResponse } from "next/server";
import {
  getRuntimeSession,
  runtimeSessionMatchesAttempt
} from "@/lib/auth/runtime-session";
import { submitAttempt } from "@/lib/db/repositories";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const logContext = createRequestLogContext(request, "api.attempts.submit");

  try {
    const { attemptId } = await context.params;
    const runtimeSession = await getRuntimeSession();
    if (!runtimeSessionMatchesAttempt(runtimeSession, { attemptId })) {
      return NextResponse.json({ ok: false, message: "Runtime session required." }, { status: 403 });
    }
    await request.json().catch(() => ({}));
    const result = await submitAttempt({
      attemptId
    });
    if (!result) {
      return NextResponse.json({ ok: false, message: "Attempt not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, result });
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
