import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";
import {
  mapCandidateExternalAssessment,
  mapCandidateExternalAssessmentAttachment
} from "./mappers";
import type {
  CandidateExternalAssessmentAttachmentRecord,
  CandidateExternalAssessmentRecord
} from "./types";

export async function createCandidateExternalAssessment(input: {
  candidateId: string;
  title: string;
  sourceLabel?: string;
  status: string;
  scorePercent?: number;
  scoreLabel?: string;
  summary?: string;
  completedAt?: Date;
  recordedById?: string;
}): Promise<CandidateExternalAssessmentRecord> {
  const assessment = await prisma.$transaction(async (tx) => {
    const created = await tx.candidateExternalAssessment.create({
      data: {
        id: cuidLike(),
        candidateId: input.candidateId,
        title: input.title,
        sourceLabel: input.sourceLabel?.trim() || null,
        status: input.status,
        scorePercent: typeof input.scorePercent === "number" ? input.scorePercent : null,
        scoreLabel: input.scoreLabel?.trim() || null,
        summary: input.summary?.trim() || null,
        completedAt: input.completedAt ?? null,
        recordedById: input.recordedById ?? null
      },
      include: {
        attachments: {
          orderBy: { uploadedAt: "desc" }
        }
      }
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: { updatedAt: new Date() }
    });

    return created;
  });

  return mapCandidateExternalAssessment(assessment);
}

export async function addCandidateExternalAssessmentAttachment(input: {
  externalAssessmentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
  uploadedById?: string;
}): Promise<CandidateExternalAssessmentAttachmentRecord> {
  const attachment = await prisma.candidateExternalAssessmentAttachment.create({
    data: {
      id: cuidLike(),
      externalAssessmentId: input.externalAssessmentId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey: input.storageKey,
      storageUrl: input.storageUrl,
      uploadedById: input.uploadedById ?? null
    }
  });

  return mapCandidateExternalAssessmentAttachment(attachment);
}

export async function getCandidateExternalAssessmentAttachmentById(
  candidateId: string,
  fileId: string
): Promise<CandidateExternalAssessmentAttachmentRecord | null> {
  const row = await prisma.candidateExternalAssessmentAttachment.findFirst({
    where: {
      id: fileId,
      externalAssessment: {
        candidateId
      }
    }
  });

  return row ? mapCandidateExternalAssessmentAttachment(row) : null;
}

export async function deleteCandidateExternalAssessment(assessmentId: string) {
  await prisma.candidateExternalAssessment.delete({
    where: { id: assessmentId }
  });
}
