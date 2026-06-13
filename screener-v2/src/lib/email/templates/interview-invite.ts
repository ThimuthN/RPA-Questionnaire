import { baseLayout, h1, p, muted, hr, ctaButton, infoTable, infoRow } from "./_base";

export interface InterviewInviteVars {
  orgName: string;
  candidateName: string;
  roleTitle: string;
  roundName: string;
  scheduledAt: Date;
  durationMin: number;
  format: string;
  interviewerNames: string[];
  meetingLink?: string;
  locationNote?: string;
  additionalNotes?: string;
  calendarUrl?: string;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short"
  });
}

function formatFormat(format: string): string {
  const map: Record<string, string> = {
    video: "Video call",
    phone: "Phone call",
    in_person: "In-person",
    panel: "Panel interview",
  };
  return map[format] ?? format;
}

export function interviewInviteEmail(vars: InterviewInviteVars): { subject: string; html: string } {
  const subject = `Interview scheduled — ${vars.roundName} for ${vars.roleTitle} at ${vars.orgName}`;

  const rows = [
    infoRow("Round", vars.roundName),
    infoRow("Date & time", formatDateTime(vars.scheduledAt)),
    infoRow("Duration", `${vars.durationMin} minutes`),
    infoRow("Format", formatFormat(vars.format)),
    vars.interviewerNames.length > 0 ? infoRow("Interviewer(s)", vars.interviewerNames.join(", ")) : "",
    vars.locationNote ? infoRow("Location / link", vars.locationNote) : "",
  ].filter(Boolean);

  const body = `
    ${h1(`Your interview is confirmed, ${vars.candidateName}.`)}
    ${p(`We're excited to move forward with your application for <strong>${vars.roleTitle}</strong>. Your <strong>${vars.roundName}</strong> has been scheduled.`)}
    ${infoTable(rows)}
    ${vars.meetingLink ? ctaButton("Join interview", vars.meetingLink) : ""}
    ${vars.calendarUrl ? `<p style="margin:0 0 16px;font-size:14px;color:#374151;">📅 <a href="${vars.calendarUrl}" style="color:#4F46E5;text-decoration:none;">Add to calendar</a></p>` : ""}
    ${vars.additionalNotes ? `${hr()}${p(vars.additionalNotes)}` : ""}
    ${hr()}
    ${muted("A calendar invite (.ics) is attached to this email. If you need to reschedule, please contact your recruiter as soon as possible.")}
  `;

  return { subject, html: baseLayout({ orgName: vars.orgName, previewText: `Interview confirmed: ${vars.roundName} on ${formatDateTime(vars.scheduledAt)}` }, body) };
}
