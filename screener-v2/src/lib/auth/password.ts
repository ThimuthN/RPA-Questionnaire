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
