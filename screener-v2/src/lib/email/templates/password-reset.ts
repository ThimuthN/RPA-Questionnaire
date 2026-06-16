import { baseLayout, h1, p, muted, hr, ctaButton } from "./_base";

export interface PasswordResetVars {
  orgName: string;
  userName?: string | null;
  resetUrl: string;
  expiresAt: Date;
}

export function passwordResetEmail(vars: PasswordResetVars): { subject: string; html: string } {
  const subject = `Reset your ${vars.orgName} password`;
  const greeting = vars.userName?.trim() ? `Hi ${vars.userName.trim()},` : "Hi,";
  const expiry = vars.expiresAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const body = `
    ${h1("Reset your password")}
    ${p(greeting)}
    ${p(`We received a request to reset the password for your <strong>${vars.orgName}</strong> account. Click below to choose a new one.`)}
    ${ctaButton("Reset password", vars.resetUrl)}
    ${muted(`For your security, this link expires at ${expiry} (about an hour from now) and can only be used once.`)}
    ${hr()}
    ${muted("If you didn't request a password reset, you can safely ignore this email — your password won't change.")}
  `;

  return {
    subject,
    html: baseLayout({ orgName: vars.orgName, previewText: `Reset your ${vars.orgName} password.` }, body)
  };
}
