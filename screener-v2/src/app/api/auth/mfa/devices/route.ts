import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/lib/auth/app-session";
import { logAudit } from "@/lib/auth/audit";

export async function GET() {
  const session = await getAppSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });

  const devices = await prisma.mfaTrustedDevice.findMany({
    where: { userId: session.userId, expiresAt: { gt: new Date() } },
    select: { id: true, deviceLabel: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    orderBy: { lastUsedAt: "desc" }
  });

  return NextResponse.json({ ok: true, devices });
}

const deleteSchema = z.object({ deviceId: z.string() });

export async function DELETE(request: Request) {
  const session = await getAppSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { deviceId } = deleteSchema.parse(await request.json());

  const device = await prisma.mfaTrustedDevice.findUnique({
    where: { id: deviceId },
    select: { userId: true, deviceLabel: true }
  });

  if (!device || device.userId !== session.userId) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await prisma.mfaTrustedDevice.delete({ where: { id: deviceId } });

  await logAudit({
    action: "mfa_device_revoked",
    actorId: session.userId,
    actorEmail: session.email,
    targetId: deviceId,
    targetType: "mfa_device",
    after: { deviceLabel: device.deviceLabel }
  });

  return NextResponse.json({ ok: true });
}
