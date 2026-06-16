import { createHmac, randomBytes } from "crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { encryptIntegrationSecret, decryptIntegrationSecret } from "@/lib/integrations/crypto";

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const BACKUP_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TRUSTED_DEVICE_TTL_DAYS = 30;

// ── Secret encryption ──────────────────────────────────────────────────────

export function encryptMfaSecret(secret: string): string {
  return encryptIntegrationSecret(secret);
}

export function decryptMfaSecret(encrypted: string): string {
  return decryptIntegrationSecret(encrypted);
}

// ── TOTP setup ─────────────────────────────────────────────────────────────

export async function generateMfaSetup(email: string, appName: string = "Northstar Hiring") {
  const secret = generateSecret({ length: 20 });
  const otpAuthUrl = generateURI({ issuer: appName, label: email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
    width: 240,
    margin: 1,
    color: { dark: "#07111f", light: "#ffffff" }
  });
  return { secret, otpAuthUrl, qrCodeDataUrl };
}

// ── TOTP verification ──────────────────────────────────────────────────────

export function verifyTotp(encryptedSecret: string, token: string): boolean {
  try {
    const secret = decryptMfaSecret(encryptedSecret);
    const result = verifySync({ secret, token: token.replace(/\s/g, ""), epochTolerance: 30 });
    return result.valid;
  } catch {
    return false;
  }
}

// ── Backup codes ───────────────────────────────────────────────────────────

function generateOneBackupCode(): string {
  const bytes = randomBytes(BACKUP_CODE_LENGTH);
  return Array.from(bytes)
    .map((b) => BACKUP_CODE_CHARS[b % BACKUP_CODE_CHARS.length])
    .join("")
    .replace(/(.{4})(.{4})/, "$1-$2");
}

function hashBackupCode(code: string): string {
  return createHmac("sha256", "mfa-backup")
    .update(code.replace(/-/g, "").toUpperCase())
    .digest("hex");
}

export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, generateOneBackupCode);
  const hashed = plain.map(hashBackupCode);
  return { plain, hashed };
}

export function serializeBackupCodes(hashed: string[]): string {
  return JSON.stringify(hashed);
}

export function parseBackupCodes(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function verifyAndConsumeBackupCode(
  code: string,
  storedHashes: string[]
): { valid: boolean; remaining: string[] } {
  const hash = hashBackupCode(code);
  const index = storedHashes.indexOf(hash);
  if (index === -1) return { valid: false, remaining: storedHashes };
  const remaining = storedHashes.filter((_, i) => i !== index);
  return { valid: true, remaining };
}

// ── Trusted devices ────────────────────────────────────────────────────────

export function generateTrustedDeviceToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHmac("sha256", "mfa-device").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashDeviceToken(token: string): string {
  return createHmac("sha256", "mfa-device").update(token).digest("hex");
}

export function trustedDeviceExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + TRUSTED_DEVICE_TTL_DAYS);
  return d;
}

// ── Device label ───────────────────────────────────────────────────────────

export function parseDeviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;

  const browser = ua.includes("Edg/") ? "Edge"
    : ua.includes("Chrome/") ? "Chrome"
    : ua.includes("Firefox/") ? "Firefox"
    : ua.includes("Safari/") && !ua.includes("Chrome") ? "Safari"
    : "Browser";

  const os = ua.includes("iPhone") || ua.includes("iPad") ? "iOS"
    : ua.includes("Android") ? "Android"
    : ua.includes("Windows") ? "Windows"
    : ua.includes("Mac OS") ? "macOS"
    : ua.includes("Linux") ? "Linux"
    : "Unknown OS";

  return `${browser} on ${os}`;
}
