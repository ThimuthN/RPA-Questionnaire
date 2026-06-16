import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { authenticateAppUser, ensureBootstrapAdmin } from "@/lib/auth/app-auth";
import { createSessionToken, sanitizeNextPath, setSessionCookie } from "@/lib/auth/session";
import {
  MFA_DEVICE_COOKIE,
  createMfaChallengeToken,
  setMfaChallengeCookie
} from "@/lib/auth/mfa-session";
import { hashDeviceToken } from "@/lib/auth/mfa";
import { isFormRequest } from "@/lib/http/request";
import { checkAuthRateLimit } from "@/lib/server/rate-limit";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";
import { logAudit } from "@/lib/auth/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.auth.login");

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = loginSchema.parse(rawBody);

    const rate = await checkAuthRateLimit({ request, identifier: body.email, scope: "login" });
    if (!rate.ok) {
      if (isFormRequest(request)) {
        const url = new URL("/login", request.url);
        url.searchParams.set("error", rate.message);
        url.searchParams.set("next", sanitizeNextPath(body.next));
        return NextResponse.redirect(url, 303);
      }
      return NextResponse.json({ ok: false, message: rate.message }, { status: 429 });
    }

    await ensureBootstrapAdmin();
    const session = await authenticateAppUser(body.email, body.password);

    if (!session) {
      void logAudit({
        action: "user_login_failed",
        actorId: null,
        actorEmail: body.email,
        targetId: body.email,
        targetType: "user",
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent")
      }).catch(() => undefined);
      if (isFormRequest(request)) {
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "Invalid email or password.");
        url.searchParams.set("next", sanitizeNextPath(body.next));
        return NextResponse.redirect(url, 303);
      }
      return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    const nextPath = sanitizeNextPath(body.next);

    // Check if MFA is enabled for this user
    const userMfa = await prisma.user.findUnique({
      where: { id: session.userId! },
      select: { mfaEnabled: true, sessionVersion: true }
    });

    if (userMfa?.mfaEnabled) {
      // Check for a valid trusted-device cookie (a Web Request has no `.cookies`,
      // so we must read it via next/headers — otherwise MFA is never skipped).
      const cookieStore = await cookies();
      const deviceToken = cookieStore.get(MFA_DEVICE_COOKIE)?.value;

      if (deviceToken) {
        const tokenHash = hashDeviceToken(deviceToken);
        const device = await prisma.mfaTrustedDevice.findUnique({
          where: { tokenHash },
          select: { id: true, userId: true, expiresAt: true }
        });

        if (device && device.userId === session.userId && device.expiresAt > new Date()) {
          // Valid trusted device — skip MFA, update lastUsedAt and grant full session
          await prisma.mfaTrustedDevice.update({
            where: { id: device.id },
            data: { lastUsedAt: new Date() }
          });

          void logAudit({
            action: "user_login",
            actorId: session.userId,
            actorEmail: session.email,
            targetId: session.userId!,
            targetType: "user",
            after: { method: "password+trusted_device" },
            ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
            userAgent: request.headers.get("user-agent")
          }).catch(() => undefined);
          const token = await createSessionToken({
            userId: session.userId,
            email: session.email,
            name: session.name,
            roleId: session.roleId,
            departmentId: session.departmentId,
            permissions: session.permissions,
            sv: userMfa?.sessionVersion ?? session.sv
          });
          const response = isFormRequest(request)
            ? NextResponse.redirect(new URL(nextPath, request.url), 303)
            : NextResponse.json({ ok: true, next: nextPath });
          setSessionCookie(response, token);
          return response;
        }
      }

      // MFA required — issue challenge token, redirect to /auth/mfa
      const challengeToken = await createMfaChallengeToken({
        userId: session.userId!,
        email: session.email,
        nextPath
      });

      const mfaUrl = new URL("/auth/mfa", request.url);
      const response = NextResponse.redirect(mfaUrl, 303);
      setMfaChallengeCookie(response, challengeToken);
      return response;
    }

    // No MFA — issue full session directly
    void logAudit({
      action: "user_login",
      actorId: session.userId,
      actorEmail: session.email,
      targetId: session.userId!,
      targetType: "user",
      after: { method: "password" },
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent")
    }).catch(() => undefined);
    const token = await createSessionToken({
      userId: session.userId,
      email: session.email,
      name: session.name,
      roleId: session.roleId,
      departmentId: session.departmentId,
      permissions: session.permissions,
      sv: session.sv
    });
    const response = isFormRequest(request)
      ? NextResponse.redirect(new URL(nextPath, request.url), 303)
      : NextResponse.json({ ok: true, next: nextPath });

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
