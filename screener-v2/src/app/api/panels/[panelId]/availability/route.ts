import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

function cuidLike() {
  return Math.random().toString(36).slice(2, 27);
}

const windowSchema = z.object({
  windows: z
    .array(
      z.object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })
    )
    .min(1)
    .max(20),
  replace: z.boolean().optional().default(false),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { panelId } = await params;

  const windows = await prisma.availabilityWindow.findMany({
    where: { panelId },
    orderBy: { startsAt: "asc" },
    select: { id: true, startsAt: true, endsAt: true },
  });

  return NextResponse.json({ windows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { panelId } = await params;

  const panel = await prisma.interviewPanel.findUnique({
    where: { id: panelId },
    select: { id: true, candidate: { select: { departmentId: true } } },
  });
  if (!panel) {
    return NextResponse.json({ ok: false, message: "Panel not found." }, { status: 404 });
  }

  const body = windowSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ ok: false, message: body.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (body.data.replace) {
      await tx.availabilityWindow.deleteMany({ where: { panelId } });
    }
    await tx.availabilityWindow.createMany({
      data: body.data.windows.map((w) => ({
        id: cuidLike(),
        panelId,
        startsAt: new Date(w.startsAt),
        endsAt: new Date(w.endsAt),
      })),
    });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { panelId } = await params;
  const url = new URL(request.url);
  const windowId = url.searchParams.get("windowId");

  if (windowId) {
    await prisma.availabilityWindow.deleteMany({ where: { id: windowId, panelId } });
  } else {
    await prisma.availabilityWindow.deleteMany({ where: { panelId } });
  }

  return NextResponse.json({ ok: true });
}
