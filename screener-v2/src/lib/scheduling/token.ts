import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 72;

export function generateSchedulingToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export async function createSchedulingToken(panelId: string): Promise<string> {
  const token = generateSchedulingToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.schedulingToken.create({
    data: {
      id: token.slice(0, 25),
      token,
      panelId,
      expiresAt,
    },
  });

  return token;
}

export async function resolveSchedulingToken(token: string) {
  const record = await prisma.schedulingToken.findUnique({
    where: { token },
    include: {
      panel: {
        include: {
          candidate: { select: { id: true, fullName: true } },
          availabilityWindows: { orderBy: { startsAt: "asc" } },
          members: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!record) return { status: "not_found" as const };
  if (record.usedAt) return { status: "used" as const };
  if (record.expiresAt < new Date()) return { status: "expired" as const };

  return { status: "valid" as const, record };
}

export async function markSchedulingTokenUsed(token: string): Promise<void> {
  await prisma.schedulingToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
