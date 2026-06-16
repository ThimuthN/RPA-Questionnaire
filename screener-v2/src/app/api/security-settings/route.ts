import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { hasGlobalPermission, isSystemAdmin } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";
import { invalidateSecuritySettingsCache } from "@/lib/auth/security-settings";
import { logAudit } from "@/lib/auth/audit";

const DEFAULT_SETTINGS = {
  mfaEnforcement: "off",
  passwordMinLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: false,
  sessionDays: 7,
  lockoutThreshold: 10,
  lockoutMinutes: 30,
} as const;

const updateSchema = z.object({
  mfaEnforcement: z.enum(["off", "admins", "all"]).optional(),
  passwordMinLength: z.number().int().min(6).max(64).optional(),
  requireUppercase: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireSpecial: z.boolean().optional(),
  sessionDays: z.number().int().min(1).max(90).optional(),
  lockoutThreshold: z.number().int().min(3).max(100).optional(),
  lockoutMinutes: z.number().int().min(5).max(1440).optional(),
});

async function canManageSecurity(session: { userId?: string | null; permissions: string[] }) {
  if (!session.userId) return false;
  return (await isSystemAdmin(session.userId)) || (await hasGlobalPermission(session.userId, "manage_users"));
}

export async function GET(_request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  if (!(await canManageSecurity(auth.session))) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const row = await prisma.orgSecuritySettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  return NextResponse.json({ ok: true, settings: row ?? DEFAULT_SETTINGS });
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  if (!(await canManageSecurity(auth.session))) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const body = updateSchema.parse(await request.json());

  const settings = await prisma.orgSecuritySettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...body, updatedById: auth.session.userId },
    update: { ...body, updatedById: auth.session.userId },
  });

  invalidateSecuritySettingsCache();

  void logAudit({
    action: "security_settings_updated",
    actorId: auth.session.userId,
    actorEmail: auth.session.email,
    targetId: "singleton",
    targetType: "org_security_settings",
    after: body,
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, settings });
}
