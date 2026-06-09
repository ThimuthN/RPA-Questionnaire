import { candidateResumeMaxSizeBytes } from "@/lib/candidates/resume-config";

export const FULL_NAME_MIN = 2;
export const FULL_NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const PHONE_MAX = 30;
export const COVER_NOTE_MAX = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfileStep(vals: {
  fullName: string;
  email: string;
  phone: string;
}): string | null {
  const name = vals.fullName.trim();
  if (name.length < FULL_NAME_MIN) return "Full name is required (at least 2 characters).";
  if (name.length > FULL_NAME_MAX) return "Full name is too long.";
  const em = vals.email.trim();
  if (!em) return "Email address is required.";
  if (em.length > EMAIL_MAX) return "Email address is too long.";
  if (!EMAIL_RE.test(em)) return "Please enter a valid email address.";
  if (vals.phone.trim().length > PHONE_MAX) return "Phone number is too long.";
  return null;
}

export function validateResumeFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF files are accepted.";
  }
  if (file.size > candidateResumeMaxSizeBytes) {
    return `File must be under ${Math.round(candidateResumeMaxSizeBytes / (1024 * 1024))} MB.`;
  }
  return null;
}
