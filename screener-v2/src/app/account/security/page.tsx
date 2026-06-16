import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/lib/auth/app-session";
import { parseBackupCodes } from "@/lib/auth/mfa";
import { mfaRequiredForSession } from "@/lib/auth/mfa-policy";
import { MfaSecurityClient } from "@/components/mfa/MfaSecurityClient";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  const session = await getAppSession();
  if (!session?.userId) redirect("/login?next=/account/security");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      mfaEnabled: true,
      mfaEnrolledAt: true,
      mfaBackupCodes: true,
      mfaTrustedDevices: {
        where: { expiresAt: { gt: new Date() } },
        select: { id: true, deviceLabel: true, lastUsedAt: true, expiresAt: true, createdAt: true },
        orderBy: { lastUsedAt: "desc" }
      }
    }
  });

  if (!user) redirect("/login");

  const backupCodesRemaining = parseBackupCodes(user.mfaBackupCodes).length;
  const enrollmentRequired = mfaRequiredForSession(session) && !user.mfaEnabled;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--app-heading)]">Security</h1>
        <p className="mt-1 text-sm text-[color:var(--app-muted)]">
          Manage your account security settings.
        </p>
      </div>

      {enrollmentRequired ? (
        <div className="rounded-xl border border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] px-4 py-3 text-sm text-[color:var(--pill-amber-text)]">
          <span className="font-semibold">Two-factor authentication is required.</span> Your
          organization requires 2FA for your account. Set it up below to continue using the workspace.
        </div>
      ) : null}

      <MfaSecurityClient
        mfaEnabled={user.mfaEnabled}
        mfaEnrolledAt={user.mfaEnrolledAt?.toISOString() ?? null}
        backupCodesRemaining={backupCodesRemaining}
        trustedDevices={user.mfaTrustedDevices.map((d) => ({
          id: d.id,
          deviceLabel: d.deviceLabel,
          lastUsedAt: d.lastUsedAt.toISOString(),
          expiresAt: d.expiresAt.toISOString(),
          createdAt: d.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
