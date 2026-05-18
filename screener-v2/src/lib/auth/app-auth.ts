import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/auth/audit";
import type { AppAccessLevel, AppSession } from "@/lib/auth/session";

export type AppUserRow = {
  id: string;
  email: string;
  name: string | null;
  title: string | null;
  department: string | null;
  departmentId: string | null;
  phone: string | null;
  accessLevel: AppAccessLevel;
  isInterviewer: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type AuditActor = {
  actorId?: string | null;
  actorEmail?: string | null;
};

export async function ensureBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Bootstrap Admin";

  if (!email || !password) {
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name,
      accessLevel: "admin",
      passwordHash: hashPassword(password),
      isActive: true
    }
  });
}

export async function authenticateAppUser(email: string, password: string): Promise<AppSession | null> {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  if (!user.isActive) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    accessLevel: user.accessLevel,
    exp: 0
  };
}

export async function listAppUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      title: true,
      department: true,
      departmentId: true,
      phone: true,
      accessLevel: true,
      isInterviewer: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function createAppUser(input: {
  email: string;
  name?: string;
  password: string;
  title?: string;
  department?: string;
  departmentId?: string;
  phone?: string;
  accessLevel: AppAccessLevel;
  isInterviewer?: boolean;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password);

  const created = await prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      title: input.title?.trim() || null,
      department: input.department?.trim() || null,
      departmentId: input.departmentId || null,
      phone: input.phone?.trim() || null,
      accessLevel: input.accessLevel,
      passwordHash,
      isInterviewer: input.isInterviewer || false
    },
    select: {
      id: true,
      email: true,
      name: true,
      title: true,
      department: true,
      departmentId: true,
      phone: true,
      accessLevel: true,
      isInterviewer: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  await logAudit({
    action: "user_created",
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? undefined,
    targetId: created.id,
    targetType: "user",
    after: {
      email: created.email,
      accessLevel: created.accessLevel,
      departmentId: created.departmentId
    }
  });

  return created;
}

export async function updateAppUser(input: {
  userId: string;
  name?: string;
  title?: string;
  department?: string;
  phone?: string;
  accessLevel?: AppAccessLevel;
  isInterviewer?: boolean;
  isActive?: boolean;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const before = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { accessLevel: true }
  });

  const data: Record<string, any> = {};
  if (input.name !== undefined) data.name = input.name?.trim() || null;
  if (input.title !== undefined) data.title = input.title?.trim() || null;
  if (input.department !== undefined) data.department = input.department?.trim() || null;
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
  if (input.accessLevel !== undefined) data.accessLevel = input.accessLevel;
  if (input.isInterviewer !== undefined) data.isInterviewer = input.isInterviewer;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const updated = await prisma.user.update({
    where: { id: input.userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      title: true,
      department: true,
      departmentId: true,
      phone: true,
      accessLevel: true,
      isInterviewer: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const accessLevelChanged = Boolean(before && before.accessLevel !== updated.accessLevel);
  await logAudit({
    action: "user_updated",
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? undefined,
    targetId: updated.id,
    targetType: "user",
    before: accessLevelChanged && before ? { accessLevel: before.accessLevel } : undefined,
    after: accessLevelChanged ? { accessLevel: updated.accessLevel } : undefined
  });

  return updated;
}

export async function deactivateAppUser(userId: string, actor?: AuditActor) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });

  await logAudit({
    action: "user_deactivated",
    actorId: actor?.actorId ?? null,
    actorEmail: actor?.actorEmail ?? undefined,
    targetId: updated.id,
    targetType: "user",
    after: { isActive: updated.isActive }
  });

  return updated;
}

export async function reactivateAppUser(userId: string, actor?: AuditActor) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });

  await logAudit({
    action: "user_reactivated",
    actorId: actor?.actorId ?? null,
    actorEmail: actor?.actorEmail ?? undefined,
    targetId: updated.id,
    targetType: "user",
    after: { isActive: updated.isActive }
  });

  return updated;
}
