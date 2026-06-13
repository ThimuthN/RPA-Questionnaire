import { baseLayout, h1, p, muted, hr, ctaButton, infoTable, infoRow } from "./_base";

export interface ScreenerInviteVars {
  orgName: string;
  candidateName: string;
  roleTitle: string;
  inviteUrl: string;
  expiresAt: Date;
  estimatedMinutes?: number;
}

export function screenerInviteEmail(vars: ScreenerInviteVars): { subject: string; html: string } {
  const subject = `Skills assessment — ${vars.roleTitle} at ${vars.orgName}`;
  const expiryStr = vars.expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const rows = [
    infoRow("Role", vars.roleTitle),
    vars.estimatedMinutes ? infoRow("Est. time", `${vars.estimatedMinutes} minutes`) : "",
    infoRow("Expires", expiryStr),
  ].filter(Boolean);

  const body = `
    ${h1(`You've been invited to complete a skills assessment, ${vars.candidateName}.`)}
    ${p(`As part of your application for <strong>${vars.roleTitle}</strong> at <strong>${vars.orgName}</strong>, we'd like you to complete a short skills assessment. This helps us understand your background and ensure the best fit.`)}
    ${infoTable(rows)}
    ${ctaButton("Start assessment", vars.inviteUrl)}
    ${p("The link above is unique to you. Please do not share it.")}
    ${hr()}
    ${muted("If you have any technical issues, please contact your recruiter. The assessment must be completed before the expiry date listed above.")}
  `;

  return { subject, html: baseLayout({ orgName: vars.orgName, previewText: `Complete your skills assessment for ${vars.roleTitle}.` }, body) };
}
