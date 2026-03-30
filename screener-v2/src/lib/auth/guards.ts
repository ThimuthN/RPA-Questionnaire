import type { Route } from "next";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { buildLoginHref, getAppSession } from "@/lib/auth/app-session";
import {
  getRuntimeSession,
  runtimeSessionMatchesAttempt
} from "@/lib/auth/runtime-session";
import type { AppSession } from "@/lib/auth/session";

type ApiAuthSuccess = { ok: true; session: AppSession };
type ApiAuthFailure = { ok: false; response: NextResponse };

function unauthorizedApi(message = "Login required.") {
  return NextResponse.json({ ok: false, message }, { status: 401 });
}

function forbiddenApi(message = "Admin access required.") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

export async function requirePageSession(nextPath: string) {
  const session = await getAppSession();
  if (!session) {
    redirect(buildLoginHref(nextPath));
  }
  return session;
}

export async function requireAdminPageSession(
  nextPath: string,
  fallbackPath: Route = "/create-test"
) {
  const session = await requirePageSession(nextPath);
  if (session.role !== "admin") {
    redirect(fallbackPath);
  }
  return session;
}

export async function requireApiSession(): Promise<ApiAuthSuccess | ApiAuthFailure> {
  const session = await getAppSession();
  if (!session) {
    return { ok: false, response: unauthorizedApi() };
  }
  return { ok: true, session };
}

export async function requireAdminApiSession(): Promise<ApiAuthSuccess | ApiAuthFailure> {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth;
  }
  if (auth.session.role !== "admin") {
    return { ok: false, response: forbiddenApi() };
  }
  return auth;
}

export function runtimeEntryHref(slug: string): Route {
  return (slug === "internal" ? "/employee/verify" : `/a/${slug}`) as Route;
}

export async function requireRuntimeAttemptPageAccess(args: {
  attemptId: string;
  slug: string;
}) {
  const runtimeSession = await getRuntimeSession();
  if (!runtimeSessionMatchesAttempt(runtimeSession, args)) {
    redirect(runtimeEntryHref(args.slug));
  }
}

export async function requireRuntimeAttemptApiAccess(attemptId: string) {
  const runtimeSession = await getRuntimeSession();
  if (!runtimeSessionMatchesAttempt(runtimeSession, { attemptId })) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: "Runtime session required." },
        { status: 403 }
      )
    };
  }

  return { ok: true as const };
}
