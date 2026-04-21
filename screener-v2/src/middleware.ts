import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthRequiredPath } from "@/lib/auth/policy";
import { SESSION_COOKIE_NAME, sanitizeNextPath } from "@/lib/auth/session";

function unauthorizedApi(message: string, status = 401) {
  return NextResponse.json({ ok: false, message }, { status });
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    sanitizeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`)
  );
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isAuthRequiredPath(pathname)) {
    if (!hasSessionCookie) {
      return isApi ? unauthorizedApi("Login required.") : redirectToLogin(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/assessments/:path*",
    "/candidates/:path*",
    "/addons/:path*",
    "/create-test/:path*",
    "/people/:path*",
    "/results/:path*",
    "/studio/:path*",
    "/users/:path*",
    "/api/candidates/:path*",
    "/api/candidate-applications/:path*",
    "/api/results/:path*",
    "/api/jobs/:path*",
    "/api/invites/create",
    "/api/auth/magic/request",
    "/api/users/:path*",
    "/api/roles/:path*",
    "/api/addons/:path*",
    "/api/addon-presets/:path*"
  ]
};
