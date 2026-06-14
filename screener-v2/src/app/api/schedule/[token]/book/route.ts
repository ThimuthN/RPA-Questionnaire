import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { resolveSchedulingToken, markSchedulingTokenUsed } from "@/lib/scheduling/token";

const bookSchema = z.object({
  windowId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const result = await resolveSchedulingToken(token);

  if (result.status === "not_found") {
    return NextResponse.json({ ok: false, message: "Invalid scheduling link." }, { status: 404 });
  }
  if (result.status === "expired") {
    return NextResponse.json({ ok: false, message: "This scheduling link has expired." }, { status: 410 });
  }
  if (result.status === "used") {
    return NextResponse.json({ ok: false, message: "This scheduling link has already been used." }, { status: 409 });
  }

  const body = bookSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const { record } = result;
  const panel = record.panel;

  const window = panel.availabilityWindows.find((w) => w.id === body.data.windowId);
  if (!window) {
    return NextResponse.json({ ok: false, message: "The selected slot is no longer available." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.interviewPanel.update({
      where: { id: panel.id },
      data: { scheduledAt: window.startsAt },
    });

    await tx.availabilityWindow.deleteMany({
      where: { panelId: panel.id },
    });
  });

  await markSchedulingTokenUsed(token);

  // Fire calendar sync if Microsoft integration is connected (fire-and-forget)
  import("@/lib/integrations/calendar-sync")
    .then(({ syncPanelToCalendar }) => syncPanelToCalendar(panel.id))
    .catch(() => undefined);

  return NextResponse.json({ ok: true });
}
