export const candidateResumeMimeTypes = [
  "application/pdf"
] as const;

export const candidateResumeMaxSizeBytes = 10 * 1024 * 1024;

export function isAllowedResumeMimeType(value: string) {
  return candidateResumeMimeTypes.includes(
    value as (typeof candidateResumeMimeTypes)[number]
  );
}

export function normalizeResumeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}
