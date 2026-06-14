import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { getUnreadCount } from "@/lib/notifications/service";

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  if (!auth.session.userId) return NextResponse.json({ count: 0 });
  const count = await getUnreadCount(auth.session.userId);
  return NextResponse.json({ count });
}
