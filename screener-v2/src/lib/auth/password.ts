import crypto from "node:crypto";

const HASH_KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, HASH_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;

  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) return false;

  const actual = crypto.scryptSync(password, salt, HASH_KEY_LENGTH);
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actual.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expectedBuffer);
}
