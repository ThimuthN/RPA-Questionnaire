import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { consumeUserAuthToken } from "@/lib/auth/user-tokens";
import { logAudit } from "@/lib/auth/audit";
import { getOrgSecuritySettings, extractPasswordPolicy } from "@/lib/auth/security-settings";

const schema = z.object({
  token: z.string().min(8),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());

    const [result, settings] = await Promise.all([
      consumeUserAuthToken(body.token, "password_reset"),
      getOrgSecuritySettings()
    ]);

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.reason }, { status: 400 });
    }

    const strength = validatePasswordStrength(body.password, extractPasswordPolicy(settings));
    if (!strength.ok) {
      return NextResponse.json({ ok: false, message: strength.message }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: result.userId },
      data: {
        passwordHash: hashPassword(body.password),
        sessionVersion: { increment: 1 }
      },
      select: { id: true, email: true }
    });

    await logAudit({
      action: "user_password_reset",
      actorId: user.id,
      actorEmail: user.email,
      targetId: user.id,
      targetType: "user",
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent")
    });

    return NextResponse.json({ ok: true, next: "/login?reset=1" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not reset password." },
      { status: 400 }
    );
  }
}
