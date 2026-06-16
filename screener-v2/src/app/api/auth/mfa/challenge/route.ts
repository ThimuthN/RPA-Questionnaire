import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import {
  MFA_CHALLENGE_COOKIE,
  verifyMfaChallengeToken,
  clearMfaChallengeCookie,
  setMfaDeviceCookie
} from "@/lib/auth/mfa-session";
import {
  verifyTotp,
  verifyAndConsumeBackupCode,
  parseBackupCodes,
  serializeBackupCodes,
  generateTrustedDeviceToken,
  trustedDeviceExpiresAt,
  parseDeviceLabel
} from "@/lib/auth/mfa";
import { getEffectivePermissions } from "@/lib/auth/permission-evaluator";
import { logAudit } from "@/lib/auth/audit";
import { checkAuthRateLimit } from "@/lib/server/rate-limit";

const schema = z.object({
  code: z.string().min(1).max(20),
  trustDevice: z.boolean().optional().default(false)
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const challengeToken = cookieStore.get(MFA_CHALLENGE_COOKIE)?.value;
    const challenge = await verifyMfaChallengeToken(challengeToken);

    if (!challenge) {
      return NextResponse.redirect(new URL("/login?error=Session+expired", request.url), 303);
    }

    // Rate limit MFA attempts
    const rate = await checkAuthRateLimit({ request, identifier: challenge.email, scope: "login" });
    if (!rate.ok) {
      return NextResponse.redirect(
        new URL("/auth/mfa?error=Too+many+attempts.+Please+wait+a+moment.", request.url),
        303
      );
    }

    const body = schema.parse(
      Object.fromEntries((await request.formData()).entries())
    );

    const user = await prisma.user.findUnique({
      where: { id: challenge.userId },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        departmentId: true,
        isActive: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true,
        sessionVersion: true
      }
    });

    if (!user || !user.isActive || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.redirect(new URL("/login?error=Authentication+failed", request.url), 303);
    }

    const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    // Try TOTP first, then backup code
    const code = body.code.replace(/\s/g, "");
    let verified = verifyTotp(user.mfaSecret, code);

    if (!verified && code.length === 8) {
      const storedHashes = parseBackupCodes(user.mfaBackupCodes);
      const result = verifyAndConsumeBackupCode(code, storedHashes);
      if (result.valid) {
        verified = true;
        await prisma.user.update({
          where: { id: user.id },
          data: { mfaBackupCodes: serializeBackupCodes(result.remaining) }
        });
        await logAudit({
          action: "mfa_backup_code_used",
          actorId: user.id,
          actorEmail: user.email,
          targetId: user.id,
          targetType: "user",
          after: { remainingCodes: result.remaining.length },
          ipAddress,
          userAgent
        });
      }
    }

    if (!verified) {
      await logAudit({
        action: "mfa_challenge_failed",
        actorId: user.id,
        actorEmail: user.email,
        targetId: user.id,
        targetType: "user",
        ipAddress,
        userAgent
      });
      return NextResponse.redirect(
        new URL("/auth/mfa?error=Invalid+code.+Please+try+again.", request.url),
        303
      );
    }

    await logAudit({
      action: "mfa_challenge_passed",
      actorId: user.id,
      actorEmail: user.email,
      targetId: user.id,
      targetType: "user",
      ipAddress,
      userAgent
    });

    const permissions = await getEffectivePermissions(user.id);
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      departmentId: user.departmentId,
      permissions,
      sv: user.sessionVersion
    });

    const response = NextResponse.redirect(new URL(challenge.nextPath, request.url), 303);
    clearMfaChallengeCookie(response);
    setSessionCookie(response, sessionToken);

    if (body.trustDevice) {
      const { token, tokenHash } = generateTrustedDeviceToken();
      const deviceLabel = parseDeviceLabel(userAgent);
      await prisma.mfaTrustedDevice.create({
        data: {
          userId: user.id,
          tokenHash,
          deviceLabel,
          expiresAt: trustedDeviceExpiresAt()
        }
      });
      setMfaDeviceCookie(response, token);
      await logAudit({
        action: "mfa_device_trusted",
        actorId: user.id,
        actorEmail: user.email,
        targetId: user.id,
        targetType: "user",
        after: { deviceLabel },
        ipAddress,
        userAgent
      });
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=Authentication+failed", request.url), 303);
  }
}
