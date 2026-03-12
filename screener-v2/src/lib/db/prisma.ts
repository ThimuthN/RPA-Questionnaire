import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  __innobotPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.__innobotPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__innobotPrisma = prisma;
}
