export const candidateExternalAssessmentAttachmentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp"
] as const;

export const candidateExternalAssessmentAttachmentAccept =
  candidateExternalAssessmentAttachmentMimeTypes.join(",");

export const candidateExternalAssessmentAttachmentMaxSizeBytes = 10 * 1024 * 1024;
export const candidateExternalAssessmentAttachmentMaxSizeMB =
  candidateExternalAssessmentAttachmentMaxSizeBytes / (1024 * 1024);
export const candidateExternalAssessmentAttachmentMaxFiles = 5;

export function normalizeExternalAssessmentFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}
