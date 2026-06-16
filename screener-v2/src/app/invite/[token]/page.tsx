import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { peekUserAuthToken } from "@/lib/auth/user-tokens";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { getOrgName } from "@/lib/email";

export const metadata: Metadata = { title: "Accept invitation" };

export default async function AcceptInvitePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const orgName = getOrgName();
  const check = await peekUserAuthToken(token, "invite");

  if (!check.ok) {
    return (
      <AuthScreen
        title="Invitation unavailable"
        subtitle={check.reason}
        footer={<Link href="/login" className="font-medium text-[color:var(--app-brand)] hover:underline">Go to sign in</Link>}
      >
        <p className="text-sm leading-6 text-[color:var(--app-muted)]">
          Ask an administrator to send you a fresh invitation link.
        </p>
      </AuthScreen>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: check.userId },
    select: { email: true, name: true }
  });

  return (
    <AuthScreen
      title={`Welcome to ${orgName}`}
      subtitle="Set a password to activate your account and get started."
    >
      <SetPasswordForm
        mode="invite"
        token={token}
        email={user?.email}
        defaultName={user?.name ?? undefined}
        submitLabel="Activate account"
      />
    </AuthScreen>
  );
}
