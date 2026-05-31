import type { Prisma } from "@prisma/client";
import { cuidLike } from "@/lib/tokens/token-service";

export async function logActivityEvent(
  tx: Prisma.TransactionClient,
  input: {
    candidateId: string;
    event: string;
    entityType?: string;
    entityId?: string;
    detail?: string;
    actorId?: string;
    actorName?: string;
  }
) {
  await tx.candidateActivityEvent.create({
    data: {
      id: cuidLike(),
      candidateId: input.candidateId,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      event: input.event,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      detail: input.detail ?? null,
      createdAt: new Date()
    }
  });
}
