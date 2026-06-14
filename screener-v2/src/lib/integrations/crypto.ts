import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function normalizeKeyMaterial(raw: string): Buffer {
  const value = raw.trim();
  if (!value) {
    throw new Error("INTEGRATIONS_ENCRYPTION_KEY is required.");
  }

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return Buffer.from(value, "hex");
  }

  try {
    const base64 = Buffer.from(value, "base64");
    if (base64.length === 32) {
      return base64;
    }
  } catch {
    // Fall through to utf8 handling.
  }

  const utf8 = Buffer.from(value, "utf8");
  if (utf8.length >= 32) {
    return utf8.subarray(0, 32);
  }

  throw new Error("INTEGRATIONS_ENCRYPTION_KEY must decode to at least 32 bytes.");
}

function getIntegrationEncryptionKey() {
  return normalizeKeyMaterial(process.env.INTEGRATIONS_ENCRYPTION_KEY ?? "");
}

export function encryptIntegrationSecret(plainText: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getIntegrationEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptIntegrationSecret(cipherText: string) {
  const [ivRaw, tagRaw, payloadRaw] = cipherText.split(".");
  if (!ivRaw || !tagRaw || !payloadRaw) {
    throw new Error("Stored integration secret is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getIntegrationEncryptionKey(),
    Buffer.from(ivRaw, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadRaw, "base64url")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

export function hasIntegrationEncryptionKey() {
  try {
    getIntegrationEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
