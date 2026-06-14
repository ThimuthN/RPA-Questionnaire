import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { createSchedulingToken } from "@/lib/scheduling/token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { panelId } = await params;

  const panel = await prisma.interviewPanel.findUnique({
    where: { id: panelId },
    select: {
      id: true,
      availabilityWindows: { select: { id: true }, take: 1 },
    },
  });

  if (!panel) {
    return NextResponse.json({ ok: false, message: "Panel not found." }, { status: 404 });
  }

  if (panel.availabilityWindows.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Add at least one availability window before creating a scheduling link." },
      { status: 422 }
    );
  }

  const token = await createSchedulingToken(panelId);
  const origin = new URL(request.url).origin;
  const url = `${origin}/schedule/${token}`;

  return NextResponse.json({ ok: true, url });
}
