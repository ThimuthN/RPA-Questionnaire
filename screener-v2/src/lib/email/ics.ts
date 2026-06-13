function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface IcsEventInput {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startAt: Date;
  durationMin: number;
  organizerEmail: string;
  organizerName?: string;
  attendeeEmails: string[];
}

export function generateIcsEvent(input: IcsEventInput): string {
  const endAt = new Date(input.startAt.getTime() + input.durationMin * 60_000);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Screener ATS//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${input.uid}@screener-ats`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(input.startAt)}`,
    `DTEND:${icsDate(endAt)}`,
    `SUMMARY:${icsEscape(input.summary)}`,
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${icsEscape(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${icsEscape(input.location)}`);
  }

  const orgName = input.organizerName ? `;CN=${icsEscape(input.organizerName)}` : "";
  lines.push(`ORGANIZER${orgName}:MAILTO:${input.organizerEmail}`);

  for (const email of input.attendeeEmails) {
    lines.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:MAILTO:${email}`);
  }

  lines.push("STATUS:CONFIRMED", "SEQUENCE:0", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
