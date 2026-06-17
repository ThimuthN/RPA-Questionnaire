import crypto from "node:crypto";

const HASH_KEY_LENGTH = 64;
// v1 format: "salt:hash" (N=16384 legacy default)
// v2 format: "2:salt:hash" (N=65536, OWASP recommended)
const SCRYPT_N_V2 = 65536;
const SCRYPT_N_V1 = 16384;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, HASH_KEY_LENGTH, { N: SCRYPT_N_V2, r: 8, p: 1 }).toString("hex");
  return `2:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;

  const parts = storedHash.split(":");
  // v2: "2:salt:hash"  v1: "salt:hash"
  const isV2 = parts.length === 3 && parts[0] === "2";
  const salt = isV2 ? parts[1] : parts[0];
  const expected = isV2 ? parts[2] : parts[1];
  if (!salt || !expected) return false;

  const N = isV2 ? SCRYPT_N_V2 : SCRYPT_N_V1;
  const actual = crypto.scryptSync(password, salt, HASH_KEY_LENGTH, { N, r: 8, p: 1 });
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actual.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(actual, expectedBuffer);
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: false,
};

export function validatePasswordStrength(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): { ok: boolean; message?: string } {
  if (password.length < policy.minLength) {
    return { ok: false, message: `Password must be at least ${policy.minLength} characters.` };
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { ok: false, message: "Password must include at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, message: "Password must include at least one lowercase letter." };
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    return { ok: false, message: "Password must include at least one number." };
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, message: "Password must include at least one special character (e.g. !@#$%^&*)." };
  }
  return { ok: true };
}
