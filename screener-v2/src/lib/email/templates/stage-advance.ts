import { baseLayout, h1, p, muted, hr, infoTable, infoRow } from "./_base";

export interface StageAdvanceVars {
  orgName: string;
  candidateName: string;
  roleTitle: string;
  fromStage: string;
  toStage: string;
  recruiterName?: string;
  recruiterEmail?: string;
  additionalMessage?: string;
}

export function stageAdvanceEmail(vars: StageAdvanceVars): { subject: string; html: string } {
  const subject = `Update on your application — ${vars.roleTitle} at ${vars.orgName}`;

  const rows = [
    infoRow("Role", vars.roleTitle),
    infoRow("Status", `Advanced to ${vars.toStage}`),
    vars.recruiterName ? infoRow("Your recruiter", vars.recruiterName) : "",
  ].filter(Boolean);

  const body = `
    ${h1(`Great news, ${vars.candidateName}!`)}
    ${p(`We're pleased to let you know that your application for <strong>${vars.roleTitle}</strong> at <strong>${vars.orgName}</strong> has advanced to the next stage.`)}
    ${infoTable(rows)}
    ${vars.additionalMessage ? p(vars.additionalMessage) : ""}
    ${p("Our team will be in touch shortly with more details about what to expect next.")}
    ${hr()}
    ${vars.recruiterEmail ? muted(`Questions? Reply to this email or contact your recruiter at ${vars.recruiterEmail}.`) : muted("Questions? Reply to this email and your recruiter will follow up.")}
  `;

  return { subject, html: baseLayout({ orgName: vars.orgName, previewText: `Your application for ${vars.roleTitle} has advanced.` }, body) };
}
