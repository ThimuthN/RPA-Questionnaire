import type { Route } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  SESSION_COOKIE_NAME,
  sanitizeNextPath,
  verifySessionToken,
  type AppRole,
  type AppSession
} from "@/lib/auth/session";

function normalizeRole(role: string): AppRole {
  return role === "admin" ? "admin" : "member";
}

export async function getAppSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;
  if (session.bootstrap || !session.userId) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
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
    role: normalizeRole(user.role)
  };
}

export function buildLoginHref(nextPath: string): Route {
  return `/login?next=${encodeURIComponent(sanitizeNextPath(nextPath))}` as Route;
}
