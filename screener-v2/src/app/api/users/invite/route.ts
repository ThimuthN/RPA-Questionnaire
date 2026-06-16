import { NextResponse } from "next/server";
import { z } from "zod";
import { createAppUser } from "@/lib/auth/app-auth";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { hasGlobalPermission, isSystemAdmin } from "@/lib/auth/permission-evaluator";
import { validateAssignableAccessRole } from "@/lib/auth/access-roles";
import { issueUserAuthToken } from "@/lib/auth/user-tokens";
import { sendEmailSafe, userInviteEmail, getOrgName, getAppUrl } from "@/lib/email";
import { prisma } from "@/lib/db/prisma";
import { logError } from "@/lib/server/logger";

const inviteSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
  permissionDepartmentId: z.string().optional()
});

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { session } = auth;

  try {
    const body = inviteSchema.parse(await request.json());
    const permissionDepartmentId = body.permissionDepartmentId || body.departmentId || null;

    // Same escalation guard as direct user creation: inviting an unassigned
    // (global) user requires global manage_users, not merely department-scoped.
    if (!permissionDepartmentId) {
      const actorId = session.userId;
      const globalOk =
        Boolean(actorId) &&
        ((await isSystemAdmin(actorId!)) || (await hasGlobalPermission(actorId!, "manage_users")));
      if (!globalOk) {
        return NextResponse.json(
          { ok: false, message: "Inviting an unassigned user requires global manage_users." },
          { status: 403 }
        );
      }
    } else {
      const permission = await requirePermissionForDepartment(session, "manage_users", permissionDepartmentId);
      if (!permission.ok) return permission.response;
    }

    if (body.roleId) {
      const validation = await validateAssignableAccessRole(body.roleId, body.departmentId, session);
      if (!validation.ok) {
        return NextResponse.json({ ok: false, message: validation.message }, { status: validation.status });
      }
    }

    const email = body.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, name: true }
    });

    // Block re-inviting an already-active member; allow re-inviting a pending
    // (password-less) account, which simply reissues the link.
    if (existing?.passwordHash) {
      return NextResponse.json(
        { ok: false, message: "That email already belongs to an active member." },
        { status: 409 }
      );
    }

    const user = existing
      ? { id: existing.id, name: existing.name }
      : await createAppUser({
          email,
          name: body.name,
          departmentId: body.departmentId,
          roleId: body.roleId,
          actorId: session.userId,
          actorEmail: session.email
        });

    const { rawToken, expiresAt } = await issueUserAuthToken({
      userId: user.id,
      purpose: "invite",
      createdById: session.userId
    });

    const acceptUrl = `${getAppUrl()}/invite/${rawToken}`;
    const { subject, html } = userInviteEmail({
      orgName: getOrgName(),
      inviteeName: body.name ?? user.name ?? null,
      inviterName: session.name ?? session.email ?? null,
      acceptUrl,
      expiresAt
    });
    sendEmailSafe({ to: email, subject, html, template: "user_invite" }).catch((err: unknown) => {
      logError("invite_email_failed", { email, error: err instanceof Error ? err.message : String(err) });
    });

    // Return the link so the admin can copy/share it directly (useful when
    // outbound email isn't configured yet).
    return NextResponse.json({ ok: true, userId: user.id, email, acceptUrl, expiresAt });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not send the invitation." },
      { status: 400 }
    );
  }
}
