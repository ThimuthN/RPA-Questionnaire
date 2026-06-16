import type { Metadata } from "next";
import Link from "next/link";
import { peekUserAuthToken } from "@/lib/auth/user-tokens";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const check = await peekUserAuthToken(token, "password_reset");

  if (!check.ok) {
    return (
      <AuthScreen
        title="Link unavailable"
        subtitle={check.reason}
        footer={<Link href="/forgot-password" className="font-medium text-[color:var(--app-brand)] hover:underline">Request a new link</Link>}
      >
        <p className="text-sm leading-6 text-[color:var(--app-muted)]">
          Password reset links expire after an hour and can only be used once.
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Set a new password" subtitle="Choose a new password for your account.">
      <SetPasswordForm mode="reset" token={token} submitLabel="Update password" />
    </AuthScreen>
  );
}
