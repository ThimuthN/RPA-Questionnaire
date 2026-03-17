import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Results", charset="UTF-8"',
      "Cache-Control": "no-store"
    }
  });
}

function decodeBasicAuth(header: string) {
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return null;
  }

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1)
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const expectedUsername = process.env.RESULTS_ACCESS_USERNAME;
  const expectedPassword = process.env.RESULTS_ACCESS_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return unauthorized();
  }

  const credentials = decodeBasicAuth(authHeader);
  if (!credentials) {
    return unauthorized();
  }

  if (credentials.username !== expectedUsername || credentials.password !== expectedPassword) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/results/:path*", "/studio/results/:path*", "/api/results/:path*"]
};
