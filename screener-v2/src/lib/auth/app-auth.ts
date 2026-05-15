import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { AppRole, AppSession } from "@/lib/auth/session";

export type AppUserRow = {
  id: string;
  email: string;
  name: string | null;
  title: string | null;
  department: string | null;
  phone: string | null;
  role: string;
  isInterviewer: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeRole(role: string): AppRole {
  if (role === "admin" || role === "recruiter" || role === "hiring_manager" || role === "interviewer") {
    return role as AppRole;
  }
  return "member";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function bootstrapUser() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Bootstrap Admin";

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    name
  };
}

export async function authenticateAppUser(email: string, password: string): Promise<AppSession | null> {
  const normalizedEmail = normalizeEmail(email);
  const bootstrap = bootstrapUser();

  if (bootstrap && normalizedEmail === bootstrap.email && password === bootstrap.password) {
    return {
      userId: null,
      email: bootstrap.email,
      name: bootstrap.name,
      role: "admin",
      bootstrap: true,
      exp: 0
    };
  }

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
    role: normalizeRole(user.role),
    bootstrap: false,
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
      phone: true,
      role: true,
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
  phone?: string;
  role: AppRole;
  isInterviewer?: boolean;
}) {
  const email = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password);

  return prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      title: input.title?.trim() || null,
      department: input.department?.trim() || null,
      phone: input.phone?.trim() || null,
      role: input.role,
      passwordHash,
      isInterviewer: input.isInterviewer || false
    },
    select: {
      id: true,
      email: true,
      name: true,
      title: true,
      department: true,
      phone: true,
      role: true,
      isInterviewer: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function updateAppUser(input: {
  userId: string;
  name?: string;
  title?: string;
  department?: string;
  phone?: string;
  role?: AppRole;
  isInterviewer?: boolean;
  isActive?: boolean;
}) {
  const data: Record<string, any> = {};
  if (input.name !== undefined) data.name = input.name?.trim() || null;
  if (input.title !== undefined) data.title = input.title?.trim() || null;
  if (input.department !== undefined) data.department = input.department?.trim() || null;
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
  if (input.role !== undefined) data.role = input.role;
  if (input.isInterviewer !== undefined) data.isInterviewer = input.isInterviewer;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return prisma.user.update({
    where: { id: input.userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      title: true,
      department: true,
      phone: true,
      role: true,
      isInterviewer: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function deactivateAppUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });
}

export async function reactivateAppUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });
}
