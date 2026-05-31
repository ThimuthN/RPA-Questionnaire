import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";
import { mapResume } from "./mappers";

export async function addCandidateResume(input: {
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
}) {
  const resume = await prisma.$transaction(async (tx) => {
    const stored = await tx.candidateResume.upsert({
      where: {
        candidateId_storageKey: {
          candidateId: input.candidateId,
          storageKey: input.storageKey
        }
      },
      update: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageUrl: input.storageUrl
      },
      create: {
        id: cuidLike(),
        candidateId: input.candidateId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        storageUrl: input.storageUrl
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    return stored;
  });

  return mapResume(resume);
}

export async function getLatestCandidateResume(candidateId: string) {
  const row = await prisma.candidateResume.findFirst({
    where: { candidateId },
    orderBy: { uploadedAt: "desc" }
  });

  return row ? mapResume(row) : null;
}

export async function getCandidateResumeByStorageKey(candidateId: string, storageKey: string) {
  const row = await prisma.candidateResume.findUnique({
    where: {
      candidateId_storageKey: {
        candidateId,
        storageKey
      }
    }
  });

  return row ? mapResume(row) : null;
}
