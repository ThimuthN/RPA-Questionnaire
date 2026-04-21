import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  __innobotPrisma?: PrismaClient;
};

const runtimeDatabaseUrl = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

export const prisma =
  globalForPrisma.__innobotPrisma ??
  new PrismaClient({
    // Prefer the direct connection for runtime writes that rely on transactions.
    ...(runtimeDatabaseUrl ? { datasourceUrl: runtimeDatabaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__innobotPrisma = prisma;
}
