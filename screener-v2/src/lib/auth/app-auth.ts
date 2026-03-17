import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { AppRole, AppSession } from "@/lib/auth/session";

function normalizeRole(role: string): AppRole {
  return role === "admin" ? "admin" : "member";
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
      role: true,
      createdAt: true
    }
  });
}

export async function createAppUser(input: {
  email: string;
  name?: string;
  password: string;
  role: AppRole;
}) {
  const email = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password);

  return prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      role: input.role,
      passwordHash
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
}
