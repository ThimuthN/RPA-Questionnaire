import { del, put } from "@vercel/blob";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;

function normalizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export function validateResumeFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Resume must be a PDF or DOCX file.");
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    throw new Error("Resume must be 10 MB or smaller.");
  }
}

export async function uploadResume(candidateId: string, file: File) {
  validateResumeFile(file);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `candidate-resumes/${candidateId}/${stamp}-${normalizeFileName(file.name)}`;
  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type
  });

  return {
    storageKey: blob.pathname,
    storageUrl: blob.url,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size
  };
}

export async function deleteResume(storageKey: string) {
  await del(storageKey);
}

export function getResumeUrl(storageUrl: string) {
  return storageUrl;
}
