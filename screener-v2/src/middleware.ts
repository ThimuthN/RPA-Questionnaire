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

  // Expose the current pathname to server components (e.g. the root layout decides
  // whether to render the app sidebar or the public shell).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isAuthRequiredPath(pathname)) {
    if (!hasSessionCookie) {
      return isApi ? unauthorizedApi("Login required.") : redirectToLogin(request);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on all page + API routes (auth enforcement is still gated by isAuthRequiredPath),
  // excluding Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|woff|woff2|ttf|css|js)$).*)"
  ]
};
