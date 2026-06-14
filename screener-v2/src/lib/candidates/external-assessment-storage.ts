import {
  candidateExternalAssessmentAttachmentMaxFiles,
  candidateExternalAssessmentAttachmentMaxSizeBytes,
  candidateExternalAssessmentAttachmentMimeTypes
} from "@/lib/candidates/external-assessment-config";
import {
  addCandidateExternalAssessmentAttachment,
  candidateExists,
  getCandidateExternalAssessmentAttachmentById,
  type CandidateExternalAssessmentAttachmentRecord
} from "@/lib/db/candidates";

export function candidateExternalAssessmentStoragePrefix(
  candidateId: string,
  externalAssessmentId: string
) {
  return `candidate-external-assessments/${candidateId}/${externalAssessmentId}/`;
}

export function isCandidateExternalAssessmentStorageKey(
  candidateId: string,
  externalAssessmentId: string,
  storageKey: string
) {
  return storageKey.startsWith(
    candidateExternalAssessmentStoragePrefix(candidateId, externalAssessmentId)
  );
}

export function assertCandidateExternalAssessmentStorageKey(
  candidateId: string,
  externalAssessmentId: string,
  storageKey: string
) {
  if (
    !isCandidateExternalAssessmentStorageKey(candidateId, externalAssessmentId, storageKey)
  ) {
    throw new Error("Invalid external assessment upload path.");
  }
}

export function assertCandidateExternalAssessmentMimeType(mimeType: string) {
  if (
    !candidateExternalAssessmentAttachmentMimeTypes.includes(
      mimeType as (typeof candidateExternalAssessmentAttachmentMimeTypes)[number]
    )
  ) {
    throw new Error("Unsupported external assessment file type.");
  }
}

export function assertCandidateExternalAssessmentSize(sizeBytes: number) {
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > candidateExternalAssessmentAttachmentMaxSizeBytes
  ) {
    throw new Error("External assessment file size is invalid.");
  }
}

export function assertCandidateExternalAssessmentFileCount(fileCount: number) {
  if (
    !Number.isInteger(fileCount) ||
    fileCount < 0 ||
    fileCount > candidateExternalAssessmentAttachmentMaxFiles
  ) {
    throw new Error(
      `You can upload up to ${candidateExternalAssessmentAttachmentMaxFiles} external assessment files.`
    );
  }
}

export async function assertCandidateExternalAssessmentCandidateExists(candidateId: string) {
  const exists = await candidateExists(candidateId);
  if (!exists) {
    throw new Error("Candidate not found.");
  }
}

export async function persistCandidateExternalAssessmentAttachment(input: {
  candidateId: string;
  externalAssessmentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
  uploadedById?: string;
}) {
  assertCandidateExternalAssessmentStorageKey(
    input.candidateId,
    input.externalAssessmentId,
    input.storageKey
  );
  assertCandidateExternalAssessmentMimeType(input.mimeType);
  assertCandidateExternalAssessmentSize(input.sizeBytes);

  return addCandidateExternalAssessmentAttachment({
    externalAssessmentId: input.externalAssessmentId,
    fileName: input.fileName.trim() || input.storageKey.split("/").pop() || "attachment",
    mimeType: input.mimeType,
    sizeBytes: Math.round(input.sizeBytes),
    storageKey: input.storageKey,
    storageUrl: input.storageUrl,
    uploadedById: input.uploadedById
  });
}

export async function resolveCandidateExternalAssessmentAttachmentRecord(input: {
  candidateId: string;
  fileId: string;
}): Promise<CandidateExternalAssessmentAttachmentRecord | null> {
  return getCandidateExternalAssessmentAttachmentById(input.candidateId, input.fileId);
}
