import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { hasGlobalPermission, isSystemAdmin } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const isAdmin = auth.session.userId
    ? (await isSystemAdmin(auth.session.userId)) ||
      (await hasGlobalPermission(auth.session.userId, "manage_users"))
    : false;
  if (!isAdmin) return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "50", 10)));
  const action = searchParams.get("action") ?? undefined;
  const actor = searchParams.get("actor")?.trim() || undefined;

  const where = {
    ...(action ? { action } : {}),
    ...(actor
      ? { actorEmail: { contains: actor, mode: "insensitive" as const } }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        actorId: true,
        actorEmail: true,
        targetId: true,
        targetType: true,
        after: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    logs: logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  });
}
