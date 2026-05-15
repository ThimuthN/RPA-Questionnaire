import { prisma } from "@/lib/db/prisma";

export async function logAudit(input: {
  action: string;
  actorId?: string | null;
  actorEmail?: string;
  targetId: string;
  targetType: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({ data: input });
}
