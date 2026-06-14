// Microsoft Graph API client for calendar events, Teams meetings, and mailbox send.

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined)
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Graph ${options.method ?? "GET"} ${path} -> ${res.status}: ${body.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export type GraphCalendarEvent = {
  id: string;
  webLink?: string;
  onlineMeeting?: { joinUrl?: string };
  onlineMeetingUrl?: string;
};

export type GraphOnlineMeeting = {
  id: string;
  joinUrl: string;
};

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    subject: string;
    body?: string;
    start: string;
    end: string;
    attendees?: Array<{ email: string; name?: string }>;
    isOnlineMeeting?: boolean;
    onlineMeetingProvider?: string;
  }
): Promise<GraphCalendarEvent> {
  const body = {
    subject: event.subject,
    body: { contentType: "HTML", content: event.body ?? "" },
    start: { dateTime: event.start, timeZone: "UTC" },
    end: { dateTime: event.end, timeZone: "UTC" },
    attendees: (event.attendees ?? []).map((a) => ({
      emailAddress: { address: a.email, name: a.name ?? a.email },
      type: "required"
    })),
    isOnlineMeeting: event.isOnlineMeeting ?? false,
    onlineMeetingProvider: event.onlineMeetingProvider ?? "unknown",
    allowNewTimeProposals: false
  };

  const result = await graphFetch(accessToken, `/me/calendars/${calendarId}/events`, {
    method: "POST",
    body: JSON.stringify(body)
  });
  return result as GraphCalendarEvent;
}

export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  patch: {
    subject?: string;
    start?: string;
    end?: string;
    attendees?: Array<{ email: string; name?: string }>;
  }
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.subject) body.subject = patch.subject;
  if (patch.start) body.start = { dateTime: patch.start, timeZone: "UTC" };
  if (patch.end) body.end = { dateTime: patch.end, timeZone: "UTC" };
  if (patch.attendees) {
    body.attendees = patch.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name ?? a.email },
      type: "required"
    }));
  }
  await graphFetch(accessToken, `/me/calendars/${calendarId}/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  await graphFetch(accessToken, `/me/calendars/${calendarId}/events/${eventId}`, {
    method: "DELETE"
  });
}

export async function createOnlineMeeting(
  accessToken: string,
  subject: string,
  startTime: string,
  endTime: string
): Promise<GraphOnlineMeeting> {
  const body = {
    subject,
    startDateTime: startTime,
    endDateTime: endTime
  };
  const result = await graphFetch(accessToken, "/me/onlineMeetings", {
    method: "POST",
    body: JSON.stringify(body)
  });
  return result as GraphOnlineMeeting;
}

export type GraphSendMailInput = {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  saveToSentItems?: boolean;
};

export async function sendViaMailbox(accessToken: string, input: GraphSendMailInput): Promise<void> {
  const message = {
    subject: input.subject,
    body: { contentType: "HTML", content: input.html },
    toRecipients: input.to.map((addr) => ({ emailAddress: { address: addr } })),
    ccRecipients: (input.cc ?? []).map((addr) => ({ emailAddress: { address: addr } }))
  };
  await graphFetch(accessToken, "/me/sendMail", {
    method: "POST",
    body: JSON.stringify({ message, saveToSentItems: input.saveToSentItems ?? true })
  });
}
