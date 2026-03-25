import crypto from "node:crypto";

export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function cuidLike(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function randomPasscode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

