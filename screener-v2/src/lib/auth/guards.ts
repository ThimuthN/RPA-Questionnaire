import type { Route } from "next";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { buildLoginHref, getAppSession } from "@/lib/auth/app-session";
import {
  getRuntimeSession,
  runtimeSessionMatchesAttempt
} from "@/lib/auth/runtime-session";
import type { AppAction } from "@/lib/auth/permissions";
import type { AppSession } from "@/lib/auth/session";
import { canUsePermissionForDepartment, hasGlobalPermission, isSystemAdmin } from "@/lib/auth/permission-evaluator";

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
  fallbackPath: Route = "/login"
) {
  const session = await requirePageSession(nextPath);
  if (!session.permissions.includes("manage_users")) {
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
  if (!auth.session.permissions.includes("manage_users")) {
    return { ok: false, response: forbiddenApi() };
  }
  return auth;
}

export function requirePermission(session: AppSession, action: AppAction) {
  if (!session.permissions.includes(action)) {
    return { ok: false as const, response: forbiddenApi(`Permission denied: ${action}`) };
  }
  return { ok: true as const };
}

export async function requireGlobalPermission(session: AppSession, action: AppAction) {
  if (!session.userId) {
    return { ok: false as const, response: forbiddenApi("Login required.") };
  }

  if (await isSystemAdmin(session.userId)) {
    return { ok: true as const };
  }

  if (!(await hasGlobalPermission(session.userId, action))) {
    return { ok: false as const, response: forbiddenApi(`Permission denied: ${action}`) };
  }

  return { ok: true as const };
}

/**
 * Auth check for role-catalog mutations.
 * System Admin bypasses permission templates — their platform grant is sufficient.
 * Department Admin (or similar) must have the explicit action in their session permissions.
 */
export async function requireRoleManagePermission(session: AppSession, action: AppAction) {
  if (!session.userId) {
    return { ok: false as const, response: forbiddenApi("Login required.") };
  }
  if (await isSystemAdmin(session.userId)) {
    return { ok: true as const };
  }
  if (!session.permissions.includes(action)) {
    return { ok: false as const, response: forbiddenApi(`Permission denied: ${action}`) };
  }
  return { ok: true as const };
}

export async function requirePermissionForDepartment(
  session: AppSession,
  action: AppAction,
  departmentId?: string | null
) {
  if (!(await canUsePermissionForDepartment(session, action, departmentId))) {
    return { ok: false as const, response: forbiddenApi(`Permission denied: ${action}`) };
  }
  return { ok: true as const };
}

export async function canAccessDepartmentWorkspace(
  session: AppSession,
  departmentId: string
): Promise<boolean> {
  if (!session.userId) return false;

  // User is in the same department - allow access
  if (session.departmentId === departmentId) {
    return true;
  }

  // System admins can access any department
  if (await isSystemAdmin(session.userId)) {
    return true;
  }

  // Check if user has global scope for common workspace permissions
  // (admin/manager can access any department)
  const globalPermissions = ["manage_users", "create_job", "edit_job", "view_candidates", "manage_candidates"];
  for (const permission of globalPermissions) {
    if (await hasGlobalPermission(session.userId, permission)) {
      return true;
    }
  }

  return false;
}

export async function requireDepartmentWorkspaceAccess(session: AppSession, departmentId: string) {
  if (!session.userId) {
    return { ok: false as const, response: forbiddenApi("Login required.") };
  }

  if (!(await canAccessDepartmentWorkspace(session, departmentId))) {
    return { ok: false as const, response: forbiddenApi("Not assigned to this department.") };
  }

  return { ok: true as const };
}

export async function getApiSession(): Promise<AppSession | null> {
  return getAppSession();
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
