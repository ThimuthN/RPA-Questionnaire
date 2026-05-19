import type { Route } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getEffectivePermissions } from "@/lib/auth/permission-evaluator";
import {
  SESSION_COOKIE_NAME,
  sanitizeNextPath,
  verifySessionToken,
  type AppSession
} from "@/lib/auth/session";

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
      roleId: true,
      departmentId: true
    }
  });

  if (!user) {
    return null;
  }

  // Load fresh permissions for this session
  const permissions = await getEffectivePermissions(user.id);

  return {
    ...session,
    userId: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    departmentId: user.departmentId,
    permissions
  };
}

export function buildLoginHref(nextPath: string): Route {
  return `/login?next=${encodeURIComponent(sanitizeNextPath(nextPath))}` as Route;
}
