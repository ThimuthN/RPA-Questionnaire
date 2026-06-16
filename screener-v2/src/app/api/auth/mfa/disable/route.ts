import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/lib/auth/app-session";
import { verifyTotp } from "@/lib/auth/mfa";
import { logAudit } from "@/lib/auth/audit";

const schema = z.object({ code: z.string().min(6) });

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = schema.parse(await request.json());

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { mfaEnabled: true, mfaSecret: true }
  });

  if (!user?.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ ok: false, message: "MFA is not enabled." }, { status: 409 });
  }

  const valid = verifyTotp(user.mfaSecret, body.code.replace(/\s/g, ""));
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Invalid code." }, { status: 422 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        mfaEnrolledAt: null
      }
    }),
    prisma.mfaTrustedDevice.deleteMany({ where: { userId: session.userId } })
  ]);

  await logAudit({
    action: "mfa_disabled",
    actorId: session.userId,
    actorEmail: session.email,
    targetId: session.userId,
    targetType: "user",
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({ ok: true });
}
