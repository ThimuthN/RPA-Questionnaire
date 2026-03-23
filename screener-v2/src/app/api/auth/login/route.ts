import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAppUser } from "@/lib/auth/app-auth";
import { createSessionToken, sanitizeNextPath, setSessionCookie } from "@/lib/auth/session";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.auth.login");

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = loginSchema.parse(rawBody);
    const session = await authenticateAppUser(body.email, body.password);

    if (!session) {
      if (isFormRequest(request)) {
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "Invalid email or password.");
        url.searchParams.set("next", sanitizeNextPath(body.next));
        return NextResponse.redirect(url, 303);
      }

      return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      bootstrap: session.bootstrap
    });
    const redirectTarget = sanitizeNextPath(body.next);
    const response = isFormRequest(request)
      ? NextResponse.redirect(new URL(redirectTarget, request.url), 303)
      : NextResponse.json({ ok: true, next: redirectTarget });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    logRouteError("login_failed", logContext, error);

    if (isFormRequest(request)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", messageFromError(error, "Login failed."));
      url.searchParams.set("requestId", logContext.requestId);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Login failed."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}
