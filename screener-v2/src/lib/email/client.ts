import { Resend } from "resend";

let _client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

export function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "noreply@innobothealth.com";
}

export function getOrgName(): string {
  // Single source of truth for the brand name; keep this default in sync with publicOrgName().
  return process.env.NEXT_PUBLIC_ORG_NAME?.trim() || "Northstar";
}

export function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
