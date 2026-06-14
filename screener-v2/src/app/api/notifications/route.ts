import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { listNotifications, markAllRead } from "@/lib/notifications/service";

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  if (!auth.session.userId) return NextResponse.json({ notifications: [] });

  const notifications = await listNotifications(auth.session.userId);
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  if (!auth.session.userId) return NextResponse.json({ ok: true });

  await markAllRead(auth.session.userId);
  return NextResponse.json({ ok: true });
}
