import { afterEach, describe, expect, it } from "vitest";
import { decryptIntegrationSecret, encryptIntegrationSecret, hasIntegrationEncryptionKey } from "./crypto";

const ORIGINAL_KEY = process.env.INTEGRATIONS_ENCRYPTION_KEY;

afterEach(() => {
  if (typeof ORIGINAL_KEY === "string") {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = ORIGINAL_KEY;
  } else {
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
  }
});

describe("integration crypto", () => {
  it("round-trips secrets with a 32-byte key", () => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";

    const encrypted = encryptIntegrationSecret("super-secret-value");

    expect(encrypted).not.toContain("super-secret-value");
    expect(decryptIntegrationSecret(encrypted)).toBe("super-secret-value");
  });

  it("rejects missing encryption key material", () => {
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;

    expect(hasIntegrationEncryptionKey()).toBe(false);
    expect(() => encryptIntegrationSecret("x")).toThrow("INTEGRATIONS_ENCRYPTION_KEY is required.");
  });

  it("detects malformed stored payloads", () => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";

    expect(() => decryptIntegrationSecret("bad-payload")).toThrow("Stored integration secret is invalid.");
  });
});
