import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/auth/audit";
import { getEffectivePermissions } from "@/lib/auth/permission-evaluator";
import { APP_ACTIONS } from "@/lib/auth/permissions";
import type { AppSession } from "@/lib/auth/session";

export type AppUserRow = {
  id: string;
  email: string;
  name: string | null;
  departmentId: string | null;
  dept: { id: string; name: string } | null;
  roleId: string | null;
  role: { id: string; label: string } | null;
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

  // Ensure System department exists
  let systemDept = await prisma.department.findUnique({
    where: { slug: "system" }
  });

  if (!systemDept) {
    systemDept = await prisma.department.create({
      data: {
        name: "System",
        slug: "system",
        isActive: true,
        sortOrder: 0
      }
    });
  }

  // Create or get system admin role
  let adminRole = await prisma.roleCatalog.findFirst({
    where: { slug: "system_admin" }
  });

  if (!adminRole) {
    adminRole = await prisma.roleCatalog.create({
      data: {
        slug: "system_admin",
        label: "System Admin",
        isActive: true,
        departmentId: systemDept.id
      }
    });

    for (const permission of APP_ACTIONS) {
      await prisma.rolePermissionTemplate.create({
        data: {
          roleId: adminRole.id,
          permission,
          scope: "global"
        }
      }).catch(() => {
        // Ignore duplicates
      });
    }
  }

  await prisma.user.create({
    data: {
      email,
      name,
      departmentId: systemDept.id,
      roleId: adminRole.id,
      passwordHash: hashPassword(password),
      isActive: true
    }
  });
}

export async function authenticateAppUser(email: string, password: string): Promise<AppSession | null> {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      roleId: true,
      departmentId: true,
      passwordHash: true,
      isActive: true
    }
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

  // Load permissions for this user
  const permissions = await getEffectivePermissions(user.id);

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    departmentId: user.departmentId,
    permissions,
    exp: 0
  };
}

export async function listAppUsers(): Promise<AppUserRow[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      departmentId: true,
      dept: {
        select: { id: true, name: true }
      },
      roleId: true,
      role: {
        select: { id: true, label: true }
      },
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
  departmentId?: string;
  roleId?: string;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password);

  const created = await prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      departmentId: input.departmentId || null,
      roleId: input.roleId || null,
      passwordHash
    },
    select: {
      id: true,
      email: true,
      name: true,
      departmentId: true,
      dept: {
        select: { id: true, name: true }
      },
      roleId: true,
      role: {
        select: { id: true, label: true }
      },
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
      roleId: created.roleId,
      departmentId: created.departmentId
    }
  });

  return created;
}

export async function updateAppUser(input: {
  userId: string;
  name?: string;
  departmentId?: string;
  roleId?: string;
  isActive?: boolean;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const before = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { departmentId: true, roleId: true }
  });

  const data: Record<string, any> = {};
  if (input.name !== undefined) data.name = input.name?.trim() || null;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId || null;
  if (input.roleId !== undefined) data.roleId = input.roleId || null;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  // Auto-clear role if department is changing and no explicit roleId provided
  const departmentChanged = before && input.departmentId !== undefined && before.departmentId !== (input.departmentId || null);
  const roleExplicitlySet = input.roleId !== undefined;
  if (departmentChanged && !roleExplicitlySet) {
    data.roleId = null;
  }

  const updated = await prisma.user.update({
    where: { id: input.userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      departmentId: true,
      dept: {
        select: { id: true, name: true }
      },
      roleId: true,
      role: {
        select: { id: true, label: true }
      },
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const roleChanged = Boolean(before && before.roleId !== updated.roleId);
  await logAudit({
    action: "user_updated",
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? undefined,
    targetId: updated.id,
    targetType: "user",
    before: roleChanged && before ? { roleId: before.roleId } : undefined,
    after: roleChanged ? { roleId: updated.roleId } : undefined
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
