export const candidateResumeMimeTypes = [
  "application/pdf"
] as const;

// Reduced to 5MB to prevent DoS via concurrent uploads at 500+ users
export const candidateResumeMaxSizeBytes = 5 * 1024 * 1024;
export const candidateResumeMaxSizeMB = candidateResumeMaxSizeBytes / (1024 * 1024);

export function isAllowedResumeMimeType(value: string) {
  return candidateResumeMimeTypes.includes(
    value as (typeof candidateResumeMimeTypes)[number]
  );
}

export function normalizeResumeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}
