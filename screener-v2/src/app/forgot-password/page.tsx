import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new password."
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
