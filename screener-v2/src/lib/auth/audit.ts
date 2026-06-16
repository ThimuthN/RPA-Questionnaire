import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(input: {
  action: string;
  actorId?: string | null;
  actorEmail?: string;
  targetId: string;
  targetType: string;
  before?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  after?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await prisma.auditLog.create({ data: input });
}
