import { baseLayout, h1, p, muted, hr } from "./_base";

export interface RejectionVars {
  orgName: string;
  candidateName: string;
  roleTitle: string;
  personalNote?: string;
  recruiterName?: string;
}

export function rejectionEmail(vars: RejectionVars): { subject: string; html: string } {
  const subject = `Your application for ${vars.roleTitle} at ${vars.orgName}`;

  const body = `
    ${h1(`Thank you for your interest, ${vars.candidateName}.`)}
    ${p(`We genuinely appreciate the time you invested in applying for the <strong>${vars.roleTitle}</strong> position at <strong>${vars.orgName}</strong> and the opportunity to learn more about your background.`)}
    ${p("After careful consideration, we've decided to move forward with other candidates whose experience more closely aligns with the current needs of the role.")}
    ${vars.personalNote ? p(vars.personalNote) : ""}
    ${p("We encourage you to apply for future openings that match your skills and experience — we'd love to stay in touch.")}
    ${hr()}
    ${muted(`Thank you again for your time${vars.recruiterName ? `, ${vars.recruiterName} and the` : " and the"} ${vars.orgName} team.`)}
  `;

  return { subject, html: baseLayout({ orgName: vars.orgName, previewText: `An update on your application for ${vars.roleTitle}.` }, body) };
}
