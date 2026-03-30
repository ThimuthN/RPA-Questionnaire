import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAdminOnlyPath,
  isAuthRequiredPath
} from "@/lib/auth/policy";
import { SESSION_COOKIE_NAME, sanitizeNextPath, verifySessionToken } from "@/lib/auth/session";

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
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/create-test", request.url));
    }
    return NextResponse.next();
  }

  if (isAuthRequiredPath(pathname)) {
    if (!session) {
      return isApi ? unauthorizedApi("Login required.") : redirectToLogin(request);
    }

    if (isAdminOnlyPath(pathname) && session.role !== "admin") {
      return isApi
        ? unauthorizedApi("Admin access required.", 403)
        : NextResponse.redirect(new URL("/create-test", request.url));
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
    "/api/results/:path*",
    "/api/invites/create",
    "/api/auth/magic/request",
    "/api/users/:path*",
    "/api/roles/:path*",
    "/api/addons/:path*",
    "/api/addon-presets/:path*"
  ]
};
