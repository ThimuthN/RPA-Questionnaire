import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSessionToken, verifySessionToken, sanitizeNextPath } from "./session";
import { base64UrlToString } from "@/lib/auth/token-codec";

// next/headers is not needed by the functions under test but session.ts imports it at module level.
// Mock it so the module can be resolved in the Node test environment.
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const BASE_PAYLOAD = {
  userId: "user-abc",
  email: "user@example.com",
  name: "Alice",
  roleId: "role-1",
  departmentId: "dept-1",
  permissions: ["view_candidates", "edit_job"],
  sv: 1,
} as const;

describe("createSessionToken", () => {
  it("returns a two-part dot-separated string (encodedPayload.signature)", async () => {
    const token = await createSessionToken(BASE_PAYLOAD);
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("first segment is valid base64url (no +, /, or = padding)", async () => {
    const token = await createSessionToken(BASE_PAYLOAD);
    const [encodedPayload] = token.split(".");
    expect(encodedPayload).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("decoded payload contains the original userId, email, and permissions", async () => {
    const token = await createSessionToken(BASE_PAYLOAD);
    const [encodedPayload] = token.split(".");
    const payload = JSON.parse(base64UrlToString(encodedPayload!));

    expect(payload.userId).toBe(BASE_PAYLOAD.userId);
    expect(payload.email).toBe(BASE_PAYLOAD.email);
    expect(payload.permissions).toEqual(BASE_PAYLOAD.permissions);
  });

  it("decoded payload contains exp approximately 7 days from now", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createSessionToken(BASE_PAYLOAD);
    const after = Math.floor(Date.now() / 1000);

    const [encodedPayload] = token.split(".");
    const payload = JSON.parse(base64UrlToString(encodedPayload!));

    const sevenDays = 60 * 60 * 24 * 7;
    expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDays - 1);
    expect(payload.exp).toBeLessThanOrEqual(after + sevenDays + 1);
  });

  it("decoded payload contains sv field when provided", async () => {
    const token = await createSessionToken({ ...BASE_PAYLOAD, sv: 3 });
    const [encodedPayload] = token.split(".");
    const payload = JSON.parse(base64UrlToString(encodedPayload!));
    expect(payload.sv).toBe(3);
  });

  it("token is round-trip verifiable via verifySessionToken", async () => {
    const token = await createSessionToken(BASE_PAYLOAD);
    const session = await verifySessionToken(token);

    expect(session).not.toBeNull();
    expect(session!.userId).toBe(BASE_PAYLOAD.userId);
    expect(session!.email).toBe(BASE_PAYLOAD.email);
    expect(session!.permissions).toEqual(BASE_PAYLOAD.permissions);
  });

  it("accepts null userId (service / unverified-email sessions)", async () => {
    const token = await createSessionToken({ ...BASE_PAYLOAD, userId: null });
    const [encodedPayload] = token.split(".");
    const payload = JSON.parse(base64UrlToString(encodedPayload!));
    expect(payload.userId).toBeNull();
  });
});

describe("verifySessionToken", () => {
  it("returns null for undefined token", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  it("returns null for null token", async () => {
    expect(await verifySessionToken(null)).toBeNull();
  });

  it("returns null for empty string", async () => {
    expect(await verifySessionToken("")).toBeNull();
  });

  it("returns null for a token with a tampered signature", async () => {
    const token = await createSessionToken(BASE_PAYLOAD);
    const [encodedPayload] = token.split(".");
    const tampered = `${encodedPayload}.invalidsignature`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("returns null for a token with a tampered payload", async () => {
    const token = await createSessionToken(BASE_PAYLOAD);
    const [, sig] = token.split(".");
    // Replace the payload segment with a different one
    const altPayload = base64UrlToString.name; // not a real payload, just a non-matching string
    const tampered = `${altPayload}.${sig}`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const token = await createSessionToken(BASE_PAYLOAD);
    const [encodedPayload, signature] = token.split(".");
    // Decode, back-date exp by 8 days, re-encode without re-signing (signature mismatch path)
    // Instead, directly construct an expired payload to test the exp guard:
    // We need a valid signature over an expired payload, which means re-signing via the actual function.
    // Use a trick: create a token, then decode and reconstruct with a past exp signed properly.
    // We can do this by mocking Date inside verifySessionToken — simpler: advance a fake token.
    // The cleanest approach is to verify the guard exists by checking a payload with exp in the past.
    const expiredPayload = JSON.stringify({
      ...BASE_PAYLOAD,
      exp: Math.floor(Date.now() / 1000) - 1,
    });

    // Build a token manually using the same codec (real codec, real secret from env)
    const { stringToBase64Url, signTokenValue } = await import("@/lib/auth/token-codec");
    const encoded = stringToBase64Url(expiredPayload);
    const secret = process.env.AUTH_SESSION_SECRET!;
    const sig = await signTokenValue(secret, encoded);
    const expiredToken = `${encoded}.${sig}`;

    expect(await verifySessionToken(expiredToken)).toBeNull();
  });

  it("returns null when permissions field is missing (not an array)", async () => {
    const { stringToBase64Url, signTokenValue } = await import("@/lib/auth/token-codec");
    const badPayload = JSON.stringify({
      userId: "x",
      email: "x@x.com",
      roleId: null,
      departmentId: null,
      exp: Math.floor(Date.now() / 1000) + 3600,
      // permissions intentionally omitted
    });
    const encoded = stringToBase64Url(badPayload);
    const secret = process.env.AUTH_SESSION_SECRET!;
    const sig = await signTokenValue(secret, encoded);
    expect(await verifySessionToken(`${encoded}.${sig}`)).toBeNull();
  });
});

describe("sanitizeNextPath", () => {
  it("returns /create-test for undefined input", () => {
    expect(sanitizeNextPath(undefined)).toBe("/create-test");
  });

  it("returns /create-test for null input", () => {
    expect(sanitizeNextPath(null)).toBe("/create-test");
  });

  it("returns /create-test for empty string", () => {
    expect(sanitizeNextPath("")).toBe("/create-test");
  });

  it("returns /create-test for paths starting with //  (protocol-relative URL)", () => {
    expect(sanitizeNextPath("//evil.com/phish")).toBe("/create-test");
  });

  it("returns /create-test for absolute http URLs", () => {
    expect(sanitizeNextPath("http://evil.com/steal")).toBe("/create-test");
  });

  it("returns /create-test for javascript: URLs", () => {
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/create-test");
  });

  it("returns /create-test for paths not starting with /", () => {
    expect(sanitizeNextPath("relative/path")).toBe("/create-test");
  });

  it("returns /dashboard for a valid internal path", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
  });

  it("returns /people/candidates for a valid nested internal path", () => {
    expect(sanitizeNextPath("/people/candidates")).toBe("/people/candidates");
  });

  it("preserves query params on valid internal paths", () => {
    expect(sanitizeNextPath("/people/candidates?tab=pipeline&page=2")).toBe(
      "/people/candidates?tab=pipeline&page=2"
    );
  });

  it("preserves hash fragments on valid internal paths", () => {
    expect(sanitizeNextPath("/dashboard#section")).toBe("/dashboard#section");
  });

  it("preserves a single root / path", () => {
    expect(sanitizeNextPath("/")).toBe("/");
  });
});
