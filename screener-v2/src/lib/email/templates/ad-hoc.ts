import { baseLayout, p, hr, muted } from "./_base";

export interface AdHocEmailVars {
  orgName: string;
  candidateName: string;
  subject: string;
  bodyHtml: string;
  senderName?: string;
  senderEmail?: string;
}

export function adHocEmail(vars: AdHocEmailVars): { subject: string; html: string } {
  const body = `
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111827;">Hi ${vars.candidateName},</h2>
    ${p(vars.bodyHtml)}
    ${hr()}
    ${vars.senderName
      ? muted(`Sent by ${vars.senderName}${vars.senderEmail ? ` &lt;${vars.senderEmail}&gt;` : ""} via ${vars.orgName} Recruiting.`)
      : muted(`Sent by the ${vars.orgName} recruiting team.`)}
  `;

  return { subject: vars.subject, html: baseLayout({ orgName: vars.orgName, previewText: vars.subject }, body) };
}
