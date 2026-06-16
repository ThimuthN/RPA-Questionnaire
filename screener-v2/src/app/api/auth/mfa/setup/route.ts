import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySync } from "otplib";
import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/lib/auth/app-session";
import {
  generateMfaSetup,
  encryptMfaSecret,
  generateBackupCodes,
  serializeBackupCodes
} from "@/lib/auth/mfa";
import { logAudit } from "@/lib/auth/audit";
import { brandOrgName } from "@/lib/brand/theme";

// GET — generate a new TOTP secret + QR code for the setup wizard
export async function GET() {
  const session = await getAppSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { mfaEnabled: true, email: true }
  });

  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (user.mfaEnabled) {
    return NextResponse.json({ ok: false, message: "MFA is already enabled." }, { status: 409 });
  }

  const appName = brandOrgName() ?? "Northstar Hiring";
  const { secret, qrCodeDataUrl, otpAuthUrl } = await generateMfaSetup(user.email, appName);

  // Return the plain secret for manual entry; will be encrypted when verified
  return NextResponse.json({ ok: true, secret, qrCodeDataUrl, otpAuthUrl });
}

// POST — verify the code and finalize MFA enrollment
const verifySchema = z.object({
  secret: z.string().min(16),
  code: z.string().length(6)
});

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = verifySchema.parse(await request.json());

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { mfaEnabled: true, email: true }
  });

  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (user.mfaEnabled) {
    return NextResponse.json({ ok: false, message: "MFA is already enabled." }, { status: 409 });
  }

  // Verify the code against the plain secret (not yet encrypted)
  const result = verifySync({ secret: body.secret, token: body.code.replace(/\s/g, ""), epochTolerance: 30 });
  const valid = result.valid;
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Invalid code. Please try again." }, { status: 422 });
  }

  const { plain, hashed } = generateBackupCodes();
  const encryptedSecret = encryptMfaSecret(body.secret);

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      mfaEnabled: true,
      mfaSecret: encryptedSecret,
      mfaBackupCodes: serializeBackupCodes(hashed),
      mfaEnrolledAt: new Date()
    }
  });

  const ipAddress = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");

  await logAudit({
    action: "mfa_enabled",
    actorId: session.userId,
    actorEmail: session.email,
    targetId: session.userId,
    targetType: "user",
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true, backupCodes: plain });
}
