import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Graph sends GET with ?validationToken= during subscription setup
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("validationToken");
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  return new NextResponse(token, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

type GraphNotification = {
  value?: Array<{
    subscriptionId?: string;
    clientState?: string;
    changeType?: string;
    resource?: string;
    resourceData?: {
      id?: string;
      "@odata.type"?: string;
    };
  }>;
};

export async function POST(request: NextRequest) {
  // Graph sends ?validationToken during lifecycle validation
  const token = request.nextUrl.searchParams.get("validationToken");
  if (token) {
    return new NextResponse(token, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  let body: GraphNotification;
  try {
    body = (await request.json()) as GraphNotification;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const notifications = body.value ?? [];

  for (const notification of notifications) {
    const subscriptionId = notification.subscriptionId;
    if (!subscriptionId) continue;

    // Verify we know about this subscription
    const subscription = await prisma.integrationWebhookSubscription.findFirst({
      where: { externalSubscriptionId: subscriptionId },
    });
    if (!subscription) continue;

    const changeType = notification.changeType;
    const resourceDataId = notification.resourceData?.id;
    if (!resourceDataId) continue;

    // Update InterviewEventSync if this event ID matches a known sync
    if (changeType === "deleted") {
      await prisma.interviewEventSync.updateMany({
        where: { externalCalendarEventId: resourceDataId },
        data: { lastSyncStatus: "cancelled", lastSyncedAt: new Date() },
      }).catch(() => undefined);
    } else if (changeType === "updated" || changeType === "created") {
      await prisma.interviewEventSync.updateMany({
        where: { externalCalendarEventId: resourceDataId },
        data: { lastSyncStatus: "synced", lastSyncedAt: new Date() },
      }).catch(() => undefined);
    }
  }

  return NextResponse.json({ ok: true });
}
