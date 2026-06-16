import { baseLayout, h1, p, muted, hr, ctaButton } from "./_base";

export interface UserInviteVars {
  orgName: string;
  inviteeName?: string | null;
  inviterName?: string | null;
  acceptUrl: string;
  expiresAt: Date;
}

export function userInviteEmail(vars: UserInviteVars): { subject: string; html: string } {
  const subject = `You've been invited to ${vars.orgName}`;
  const greeting = vars.inviteeName?.trim() ? `Hi ${vars.inviteeName.trim()},` : "Hi,";
  const invitedBy = vars.inviterName?.trim() ? ` by ${vars.inviterName.trim()}` : "";
  const expiry = vars.expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const body = `
    ${h1(`Join ${vars.orgName} on Northstar`)}
    ${p(greeting)}
    ${p(`You've been invited${invitedBy} to join the <strong>${vars.orgName}</strong> hiring workspace. Set a password to activate your account and get started.`)}
    ${ctaButton("Accept invitation", vars.acceptUrl)}
    ${muted(`This invitation link is unique to you — please don't share it. It expires on ${expiry}.`)}
    ${hr()}
    ${muted("If you weren't expecting this invitation, you can safely ignore this email.")}
  `;

  return {
    subject,
    html: baseLayout({ orgName: vars.orgName, previewText: `Set your password to join ${vars.orgName}.` }, body)
  };
}
