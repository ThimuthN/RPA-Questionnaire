import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.userId) {
    void logAudit({
      action: "user_logout",
      actorId: session.userId,
      actorEmail: session.email,
      targetId: session.userId,
      targetType: "user",
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent")
    }).catch(() => undefined);
  }
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearSessionCookie(response);
  return response;
}
