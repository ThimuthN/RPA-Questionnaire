import { baseLayout, h1, p, muted, hr, infoTable, infoRow } from "./_base";

export interface ApplicationReceivedVars {
  orgName: string;
  candidateName: string;
  roleTitle: string;
  departmentName?: string;
  applicationDate: string;
}

export function applicationReceivedEmail(vars: ApplicationReceivedVars): { subject: string; html: string } {
  const subject = `Application received — ${vars.roleTitle} at ${vars.orgName}`;
  const rows = [
    infoRow("Role", vars.roleTitle),
    vars.departmentName ? infoRow("Department", vars.departmentName) : "",
    infoRow("Received", vars.applicationDate),
  ].filter(Boolean);

  const body = `
    ${h1(`We received your application, ${vars.candidateName}.`)}
    ${p(`Thank you for applying to the <strong>${vars.roleTitle}</strong> position at <strong>${vars.orgName}</strong>. We've received your application and our team will review it shortly.`)}
    ${infoTable(rows)}
    ${p("Our recruiting team typically responds within 5–7 business days. We'll be in touch with next steps.")}
    ${hr()}
    ${muted("You don't need to take any action at this time. If you have questions, please contact your recruiter directly.")}
  `;

  return { subject, html: baseLayout({ orgName: vars.orgName, previewText: `Your application for ${vars.roleTitle} has been received.` }, body) };
}
