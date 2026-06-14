import { prisma } from "@/lib/db/prisma";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "@/lib/integrations/crypto";
import { refreshMicrosoftToken } from "@/lib/integrations/providers/microsoft";
import {
  createCalendarEvent,
  createOnlineMeeting,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/integrations/graph";

async function getMicrosoftAccessToken(departmentId: string): Promise<{
  accessToken: string;
  calendarId: string | null;
  connectionId: string;
} | null> {
  const connection = await prisma.departmentIntegrationConnection.findUnique({
    where: { departmentId_provider: { departmentId, provider: "microsoft" } },
    include: {
      resources: {
        where: { resourceType: "calendar", isDefault: true },
        take: 1,
      },
    },
  });

  if (!connection || connection.status !== "connected") return null;
  if (!connection.accessTokenEncrypted) return null;

  const providerRow = await prisma.integrationProviderApp.findUnique({
    where: { provider: "microsoft" },
  });
  if (!providerRow?.clientId || !providerRow.clientSecretEncrypted) return null;

  let accessToken = decryptIntegrationSecret(connection.accessTokenEncrypted);
  const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;

  if (!accessToken || (expiresAt && expiresAt < Date.now() + 60_000)) {
    if (!connection.refreshTokenEncrypted) return null;
    const refreshToken = decryptIntegrationSecret(connection.refreshTokenEncrypted);
    try {
      const config = {
        provider: "microsoft" as const,
        clientId: providerRow.clientId,
        clientSecret: decryptIntegrationSecret(providerRow.clientSecretEncrypted),
        tenantId: providerRow.tenantId ?? undefined,
        enabled: true,
        scopes: [],
      };
      const refreshed = await refreshMicrosoftToken({ config, refreshToken });
      await prisma.departmentIntegrationConnection.update({
        where: { id: connection.id },
        data: {
          accessTokenEncrypted: encryptIntegrationSecret(refreshed.accessToken),
          refreshTokenEncrypted: refreshed.refreshToken
            ? encryptIntegrationSecret(refreshed.refreshToken)
            : connection.refreshTokenEncrypted,
          tokenExpiresAt: refreshed.expiresAt ?? null,
        },
      });
      accessToken = refreshed.accessToken;
    } catch {
      return null;
    }
  }

  return {
    accessToken,
    calendarId: connection.resources[0]?.externalResourceId ?? null,
    connectionId: connection.id,
  };
}

async function getPanelWithCandidate(panelId: string) {
  return prisma.interviewPanel.findUnique({
    where: { id: panelId },
    include: {
      candidate: { select: { departmentId: true, fullName: true, email: true } },
      milestone: { select: { title: true } },
      members: {
        include: { user: { select: { email: true, name: true } } },
      },
      eventSync: true,
    },
  });
}

export async function syncPanelToCalendar(panelId: string): Promise<void> {
  const panel = await getPanelWithCandidate(panelId);
  if (!panel?.scheduledAt || !panel.candidate.departmentId) return;

  const conn = await getMicrosoftAccessToken(panel.candidate.departmentId);
  if (!conn) return;

  const startTime = panel.scheduledAt.toISOString();
  const endTime = new Date(
    panel.scheduledAt.getTime() + panel.durationMin * 60_000
  ).toISOString();
  const subject = `Interview: ${panel.candidate.fullName} — ${panel.roundName}`;
  const attendees = panel.members.map((m) => ({
    email: m.user.email,
    name: m.user.name ?? undefined,
  }));
  if (panel.candidate.email) {
    attendees.push({ email: panel.candidate.email, name: panel.candidate.fullName });
  }

  try {
    if (panel.eventSync) {
      // Update existing event
      if (conn.calendarId) {
        await updateCalendarEvent(conn.accessToken, conn.calendarId, panel.eventSync.externalCalendarEventId, {
          subject,
          start: startTime,
          end: endTime,
          attendees,
        });
      }
      await prisma.interviewEventSync.update({
        where: { id: panel.eventSync.id },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: "synced",
          lastError: null,
        },
      });
    } else {
      // Create new event — optionally with Teams meeting
      let meetingUrl: string | null = null;
      let externalMeetingId: string | null = null;

      if (panel.format === "video") {
        try {
          const meeting = await createOnlineMeeting(conn.accessToken, subject, startTime, endTime);
          meetingUrl = meeting.joinUrl;
          externalMeetingId = meeting.id;
        } catch {
          // Teams meeting creation failure should not block calendar event
        }
      }

      let externalCalendarEventId = "";
      if (conn.calendarId) {
        const created = await createCalendarEvent(conn.accessToken, conn.calendarId, {
          subject,
          start: startTime,
          end: endTime,
          attendees,
          isOnlineMeeting: panel.format === "video" && !meetingUrl,
          onlineMeetingProvider: panel.format === "video" ? "teamsForBusiness" : undefined,
        });
        externalCalendarEventId = created.id;
        if (!meetingUrl && created.onlineMeeting?.joinUrl) {
          meetingUrl = created.onlineMeeting.joinUrl;
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.interviewEventSync.create({
          data: {
            interviewPanelId: panelId,
            connectionId: conn.connectionId,
            provider: "microsoft",
            externalCalendarEventId,
            externalMeetingId: externalMeetingId ?? undefined,
            joinUrl: meetingUrl ?? undefined,
            organizerAccountId: undefined,
            lastSyncedAt: new Date(),
            lastSyncStatus: "synced",
          },
        });

        if (meetingUrl) {
          await tx.interviewPanel.update({
            where: { id: panelId },
            data: { meetingUrl },
          });
        }
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calendar sync failed";
    if (panel.eventSync) {
      await prisma.interviewEventSync.update({
        where: { id: panel.eventSync.id },
        data: { lastSyncStatus: "error", lastError: message, lastSyncedAt: new Date() },
      }).catch(() => undefined);
    }
  }
}

export async function cancelPanelCalendarEvent(panelId: string): Promise<void> {
  const sync = await prisma.interviewEventSync.findUnique({
    where: { interviewPanelId: panelId },
    include: {
      connection: {
        select: {
          departmentId: true,
          resources: {
            where: { resourceType: "calendar", isDefault: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!sync) return;

  const conn = await getMicrosoftAccessToken(sync.connection.departmentId);
  if (!conn) return;

  try {
    if (conn.calendarId && sync.externalCalendarEventId) {
      await deleteCalendarEvent(conn.accessToken, conn.calendarId, sync.externalCalendarEventId);
    }
    await prisma.interviewEventSync.update({
      where: { id: sync.id },
      data: { lastSyncStatus: "cancelled", lastSyncedAt: new Date() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    await prisma.interviewEventSync.update({
      where: { id: sync.id },
      data: { lastSyncStatus: "error", lastError: message, lastSyncedAt: new Date() },
    }).catch(() => undefined);
  }
}
