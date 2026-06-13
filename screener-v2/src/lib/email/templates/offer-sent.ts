import { baseLayout, h1, p, muted, hr, infoTable, infoRow } from "./_base";

export interface OfferSentVars {
  orgName: string;
  candidateName: string;
  roleTitle: string;
  compensationFormatted: string;
  targetStartDate?: string;
  expiresAt?: string;
  offerNotes?: string;
  recruiterName?: string;
  recruiterEmail?: string;
}

export function offerSentEmail(vars: OfferSentVars): { subject: string; html: string } {
  const subject = `Your offer — ${vars.roleTitle} at ${vars.orgName}`;

  const rows = [
    infoRow("Role", vars.roleTitle),
    infoRow("Compensation", vars.compensationFormatted),
    vars.targetStartDate ? infoRow("Start date", vars.targetStartDate) : "",
    vars.expiresAt ? infoRow("Offer expires", vars.expiresAt) : "",
  ].filter(Boolean);

  const body = `
    ${h1(`We'd love for you to join us, ${vars.candidateName}.`)}
    ${p(`Congratulations! We are thrilled to offer you the <strong>${vars.roleTitle}</strong> position at <strong>${vars.orgName}</strong>. This is a reflection of the talent and enthusiasm you demonstrated throughout the process.`)}
    ${infoTable(rows)}
    ${vars.offerNotes ? p(vars.offerNotes) : ""}
    ${p("Please review the details carefully and let us know your decision at your earliest convenience.")}
    ${hr()}
    ${vars.recruiterEmail
      ? muted(`To accept, decline, or ask questions, please reply directly to this email or contact <a href="mailto:${vars.recruiterEmail}" style="color:#4F46E5;">${vars.recruiterName ?? vars.recruiterEmail}</a>.`)
      : muted("To accept, decline, or ask questions, please reply to this email and your recruiter will follow up.")}
  `;

  return { subject, html: baseLayout({ orgName: vars.orgName, previewText: `Congratulations! Your offer for ${vars.roleTitle} is ready.` }, body) };
}
