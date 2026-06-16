import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { consumeUserAuthToken } from "@/lib/auth/user-tokens";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { getEffectivePermissions } from "@/lib/auth/permission-evaluator";
import { logAudit } from "@/lib/auth/audit";

const schema = z.object({
  token: z.string().min(8),
  password: z.string().min(8, "Use at least 8 characters."),
  name: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());

    const result = await consumeUserAuthToken(body.token, "invite");
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.reason }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: result.userId },
      data: {
        passwordHash: hashPassword(body.password),
        isActive: true,
        ...(body.name?.trim() ? { name: body.name.trim() } : {})
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, email: true, name: true, roleId: true, departmentId: true, isActive: true }
    });
    if (!user || !user.isActive) {
      return NextResponse.json({ ok: false, message: "Account is not available." }, { status: 400 });
    }

    const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
    await logAudit({
      action: "user_invite_accepted",
      actorId: user.id,
      actorEmail: user.email,
      targetId: user.id,
      targetType: "user",
      ipAddress,
      userAgent: request.headers.get("user-agent")
    });

    // Auto sign-in so the invitee lands straight in the workspace (MFA enrollment,
    // if enforced, is handled by the authenticated layout).
    const permissions = await getEffectivePermissions(user.id);
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      departmentId: user.departmentId,
      permissions
    });

    const response = NextResponse.json({ ok: true, next: "/" });
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not complete setup." },
      { status: 400 }
    );
  }
}
