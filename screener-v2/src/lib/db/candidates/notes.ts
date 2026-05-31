import { prisma } from "@/lib/db/prisma";
import type { CandidateNoteType } from "@/lib/candidates/types";
import { cuidLike } from "@/lib/tokens/token-service";
import { mapNote } from "./mappers";

export async function addCandidateNote(input: {
  candidateId: string;
  type: CandidateNoteType;
  body: string;
  createdById?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.candidateNote.create({
      data: {
        id: cuidLike(),
        candidateId: input.candidateId,
        type: input.type,
        body: input.body.trim(),
        createdById: input.createdById ?? null
      },
      select: {
        id: true,
        candidateId: true,
        type: true,
        body: true,
        createdAt: true,
        createdById: true
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    return created;
  });

  return mapNote(result);
}

export async function updateCandidateNote(input: {
  noteId: string;
  candidateId: string;
  body: string;
  updatedById?: string;
  updatedByName?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.candidateNote.update({
      where: { id: input.noteId },
      data: {
        body: input.body.trim(),
        updatedById: input.updatedById ?? null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        candidateId: true,
        type: true,
        body: true,
        createdAt: true,
        createdById: true
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: { updatedAt: new Date() }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: input.candidateId,
        actorId: input.updatedById ?? null,
        actorName: input.updatedByName ?? null,
        event: "note_updated",
        entityType: "note",
        entityId: input.noteId,
        detail: input.body.slice(0, 100),
        createdAt: new Date()
      }
    });

    return updated;
  });

  return mapNote(result);
}

export async function deleteCandidateNote(input: {
  noteId: string;
  candidateId: string;
  deletedById?: string;
  deletedByName?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.candidateNote.update({
      where: { id: input.noteId },
      data: {
        deletedAt: new Date()
      },
      select: {
        id: true,
        candidateId: true,
        type: true,
        body: true,
        createdAt: true,
        deletedAt: true,
        createdById: true
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: { updatedAt: new Date() }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: input.candidateId,
        actorId: input.deletedById ?? null,
        actorName: input.deletedByName ?? null,
        event: "note_deleted",
        entityType: "note",
        entityId: input.noteId,
        detail: deleted.body.slice(0, 100),
        createdAt: new Date()
      }
    });

    return deleted;
  });

  return mapNote(result);
}
