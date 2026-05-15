import type { Route } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  SESSION_COOKIE_NAME,
  sanitizeNextPath,
  verifySessionToken,
  type AppAccessLevel,
  type AppSession
} from "@/lib/auth/session";

function normalizeAccessLevel(accessLevel: string): AppAccessLevel {
  const valid: AppAccessLevel[] = ["admin", "recruiter", "hiring_manager", "interviewer", "member"];
  return valid.includes(accessLevel as AppAccessLevel) ? (accessLevel as AppAccessLevel) : "member";
}

export async function getAppSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;
  if (!session.userId) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      accessLevel: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    userId: user.id,
    email: user.email,
    name: user.name,
    accessLevel: normalizeAccessLevel(user.accessLevel)
  };
}

export function buildLoginHref(nextPath: string): Route {
  return `/login?next=${encodeURIComponent(sanitizeNextPath(nextPath))}` as Route;
}
