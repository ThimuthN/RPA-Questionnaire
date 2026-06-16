import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { issueUserAuthToken } from "@/lib/auth/user-tokens";
import { sendEmailSafe, passwordResetEmail, getOrgName, getAppUrl } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/server/rate-limit";
import { logError } from "@/lib/server/logger";

const schema = z.object({ email: z.string().email() });

// Always responds ok — never reveals whether an account exists (no enumeration).
const OK = { ok: true, message: "If an account exists for that email, a reset link is on its way." };

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const rate = await checkAuthRateLimit({ request, identifier: email, scope: "login" });
    if (!rate.ok) {
      return NextResponse.json({ ok: false, message: rate.message }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isActive: true, passwordHash: true }
    });

    // Only send to real, active accounts that have a password (pending invitees
    // should use their invite link instead). Response is identical either way.
    if (user && user.isActive && user.passwordHash) {
      const { rawToken, expiresAt } = await issueUserAuthToken({ userId: user.id, purpose: "password_reset" });
      const resetUrl = `${getAppUrl()}/reset-password/${rawToken}`;
      const { subject, html } = passwordResetEmail({
        orgName: getOrgName(),
        userName: user.name,
        resetUrl,
        expiresAt
      });
      sendEmailSafe({ to: email, subject, html, template: "password_reset" }).catch((err: unknown) => {
        logError("password_reset_email_failed", { email, error: err instanceof Error ? err.message : String(err) });
      });
    }

    return NextResponse.json(OK);
  } catch {
    // Even on malformed input, don't leak anything.
    return NextResponse.json(OK);
  }
}
