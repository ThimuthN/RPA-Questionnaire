import {
  candidateResumeMaxSizeBytes,
  candidateResumeMimeTypes
} from "@/lib/candidates/resume-config";
import {
  addCandidateResume,
  candidateExists,
  getCandidateResumeByStorageKey,
  getLatestCandidateResume,
  type CandidateResumeRecord
} from "@/lib/db/candidates";

export function candidateResumeStoragePrefix(candidateId: string) {
  return `candidate-resumes/${candidateId}/`;
}

export function isCandidateResumeStorageKey(candidateId: string, storageKey: string) {
  return storageKey.startsWith(candidateResumeStoragePrefix(candidateId));
}

export function assertCandidateResumeStorageKey(candidateId: string, storageKey: string) {
  if (!isCandidateResumeStorageKey(candidateId, storageKey)) {
    throw new Error("Invalid resume upload path.");
  }
}

export function assertCandidateResumeMimeType(mimeType: string) {
  if (!candidateResumeMimeTypes.includes(mimeType as (typeof candidateResumeMimeTypes)[number])) {
    throw new Error("Unsupported resume file type.");
  }
}

export function assertCandidateResumeSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > candidateResumeMaxSizeBytes) {
    throw new Error("Resume size is invalid.");
  }
}

export async function assertCandidateResumeCandidateExists(candidateId: string) {
  const exists = await candidateExists(candidateId);
  if (!exists) {
    throw new Error("Candidate not found.");
  }
}

export async function persistCandidateResumeUpload(input: {
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
}) {
  assertCandidateResumeStorageKey(input.candidateId, input.storageKey);
  assertCandidateResumeMimeType(input.mimeType);
  assertCandidateResumeSize(input.sizeBytes);

  return addCandidateResume({
    candidateId: input.candidateId,
    fileName: input.fileName.trim() || input.storageKey.split("/").pop() || "resume",
    mimeType: input.mimeType,
    sizeBytes: Math.round(input.sizeBytes),
    storageKey: input.storageKey,
    storageUrl: input.storageUrl
  });
}

export async function resolveCandidateResumeRecord(input: {
  candidateId: string;
  storageKey?: string;
}): Promise<CandidateResumeRecord | null> {
  if (input.storageKey) {
    return getCandidateResumeByStorageKey(input.candidateId, input.storageKey);
  }

  return getLatestCandidateResume(input.candidateId);
}
