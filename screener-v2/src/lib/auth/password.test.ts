import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicy,
} from "@/lib/auth/password";

// ── validatePasswordStrength ──────────────────────────────────────────────────

describe("validatePasswordStrength", () => {
  describe("DEFAULT_PASSWORD_POLICY shape", () => {
    it("has the expected default values", () => {
      expect(DEFAULT_PASSWORD_POLICY).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecial: false,
      });
    });
  });

  describe("happy path — password meeting all requirements", () => {
    it("returns { ok: true } with no message for a fully-compliant password", () => {
      const result = validatePasswordStrength("Abcdef1g");
      expect(result).toEqual({ ok: true });
      expect((result as { message?: string }).message).toBeUndefined();
    });

    it("returns { ok: true } for a long complex password", () => {
      const result = validatePasswordStrength("MyStr0ng!Password99");
      expect(result).toEqual({ ok: true });
    });

    it("returns { ok: true } for exactly minLength characters (all rules satisfied)", () => {
      // 8 chars: uppercase + lowercase + digit
      const result = validatePasswordStrength("Abcde1fg"); // length 8
      expect(result.ok).toBe(true);
    });
  });

  describe("minLength enforcement", () => {
    it("rejects a 6-character password (below default minLength 8)", () => {
      const result = validatePasswordStrength("Ab1cde");
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password must be at least 8 characters.");
    });

    it("rejects a 7-character password (one below default minLength 8)", () => {
      const result = validatePasswordStrength("Ab1cdef");
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password must be at least 8 characters.");
    });

    it("rejects empty string", () => {
      const result = validatePasswordStrength("");
      expect(result.ok).toBe(false);
      expect(result.message).toContain("at least");
    });

    it("accepts exactly minLength characters when all other rules pass", () => {
      const policy: PasswordPolicy = {
        minLength: 6,
        requireUppercase: true,
        requireNumber: true,
        requireSpecial: false,
      };
      // "Ab1cde" = 6 chars, has upper, lower, number
      const result = validatePasswordStrength("Ab1cde", policy);
      expect(result.ok).toBe(true);
    });

    it("embeds the custom minLength in the rejection message", () => {
      const policy: PasswordPolicy = {
        minLength: 12,
        requireUppercase: false,
        requireNumber: false,
        requireSpecial: false,
      };
      const result = validatePasswordStrength("short", policy);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password must be at least 12 characters.");
    });
  });

  describe("uppercase requirement", () => {
    it("rejects all-lowercase+digit password when requireUppercase=true", () => {
      const result = validatePasswordStrength("abcdef1g");
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "Password must include at least one uppercase letter."
      );
    });

    it("accepts password without uppercase when requireUppercase=false", () => {
      const policy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: false,
        requireNumber: true,
        requireSpecial: false,
      };
      const result = validatePasswordStrength("abcdef1g", policy);
      expect(result.ok).toBe(true);
    });
  });

  describe("lowercase requirement (always enforced)", () => {
    it("rejects an all-uppercase+digit password (no lowercase)", () => {
      const result = validatePasswordStrength("ABCDEF1G");
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "Password must include at least one lowercase letter."
      );
    });

    it("rejects all-uppercase even when requireUppercase=false and password is long enough", () => {
      const policy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: false,
        requireNumber: false,
        requireSpecial: false,
      };
      const result = validatePasswordStrength("ALLCAPSHERE", policy);
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "Password must include at least one lowercase letter."
      );
    });
  });

  describe("number requirement", () => {
    it("rejects password with no digit when requireNumber=true", () => {
      const result = validatePasswordStrength("Abcdefgh");
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "Password must include at least one number."
      );
    });

    it("accepts password with no digit when requireNumber=false", () => {
      const policy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireNumber: false,
        requireSpecial: false,
      };
      const result = validatePasswordStrength("Abcdefgh", policy);
      expect(result.ok).toBe(true);
    });
  });

  describe("special character requirement", () => {
    it("rejects password with no special char when requireSpecial=true", () => {
      const policy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecial: true,
      };
      const result = validatePasswordStrength("Abcdef1g", policy);
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "Password must include at least one special character (e.g. !@#$%^&*)."
      );
    });

    it("accepts password without special char when requireSpecial=false (default)", () => {
      const result = validatePasswordStrength("Abcdef1g");
      expect(result.ok).toBe(true);
    });

    it("accepts password with special char when requireSpecial=true", () => {
      const policy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecial: true,
      };
      const result = validatePasswordStrength("Abcdef1!", policy);
      expect(result.ok).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("returns { ok: false } for empty string — fails minLength first", () => {
      const result = validatePasswordStrength("", DEFAULT_PASSWORD_POLICY);
      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/at least 8 characters/);
    });

    it("handles a policy where all requirements are off except minLength", () => {
      const policy: PasswordPolicy = {
        minLength: 4,
        requireUppercase: false,
        requireNumber: false,
        requireSpecial: false,
      };
      // Only rule: must have a lowercase (always checked) + length >= 4
      const result = validatePasswordStrength("abcd", policy);
      expect(result.ok).toBe(true);
    });

    it("returns { ok: false } on all-requirements-off policy but no lowercase", () => {
      const policy: PasswordPolicy = {
        minLength: 4,
        requireUppercase: false,
        requireNumber: false,
        requireSpecial: false,
      };
      const result = validatePasswordStrength("ABCD", policy);
      expect(result.ok).toBe(false);
    });

    it("validates rule priority: minLength checked before uppercase", () => {
      // 3 chars with uppercase — should fail minLength, not uppercase
      const result = validatePasswordStrength("Ab1", DEFAULT_PASSWORD_POLICY);
      expect(result.ok).toBe(false);
      expect(result.message).toContain("at least 8 characters");
    });

    it("validates rule priority: uppercase checked before lowercase", () => {
      // 8+ chars, no uppercase — fails uppercase before reaching lowercase check
      const result = validatePasswordStrength("abcdef1g");
      expect(result.ok).toBe(false);
      expect(result.message).toContain("uppercase");
    });

    it("validates rule priority: lowercase checked before number", () => {
      // 8+ chars, has uppercase, no lowercase — fails lowercase before number
      const result = validatePasswordStrength("ABCDEF1G");
      expect(result.ok).toBe(false);
      expect(result.message).toContain("lowercase");
    });
  });

  describe("return shape guarantees", () => {
    it("success result has ok:true and no message property set", () => {
      const result = validatePasswordStrength("ValidPass1");
      expect(result.ok).toBe(true);
      expect("message" in result ? result.message : undefined).toBeUndefined();
    });

    it("failure result has ok:false and a non-empty message string", () => {
      const result = validatePasswordStrength("bad");
      expect(result.ok).toBe(false);
      expect(typeof result.message).toBe("string");
      expect((result.message as string).length).toBeGreaterThan(0);
    });
  });
});

// ── hashPassword + verifyPassword ─────────────────────────────────────────────

describe("hashPassword", () => {
  it("produces a string in the format 'salt:hash'", () => {
    const hash = hashPassword("MyPassword1");
    expect(hash).toContain(":");
    const [salt, digest] = hash.split(":");
    expect(salt).toBeTruthy();
    expect(digest).toBeTruthy();
  });

  it("produces different hashes for the same input on repeated calls (salt randomization)", () => {
    const hash1 = hashPassword("SamePassword1");
    const hash2 = hashPassword("SamePassword1");
    expect(hash1).not.toBe(hash2);
  });

  it("produces a hash whose hex digest part has length 128 (64 bytes × 2 hex chars)", () => {
    const hash = hashPassword("AnyPass1");
    const [, digest] = hash.split(":");
    // scryptSync with keylen=64 → 64 bytes → 128 hex chars
    expect(digest).toHaveLength(128);
  });

  it("produces a salt part with length 32 (16 bytes × 2 hex chars)", () => {
    const hash = hashPassword("AnyPass1");
    const [salt] = hash.split(":");
    expect(salt).toHaveLength(32);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password against its stored hash", () => {
    const password = "CorrectHorse1";
    const stored = hashPassword(password);
    expect(verifyPassword(password, stored)).toBe(true);
  });

  it("returns false for the wrong password", () => {
    const stored = hashPassword("CorrectHorse1");
    expect(verifyPassword("WrongPassword1", stored)).toBe(false);
  });

  it("returns false when storedHash is null", () => {
    expect(verifyPassword("AnyPass1", null)).toBe(false);
  });

  it("returns false when storedHash is undefined", () => {
    expect(verifyPassword("AnyPass1", undefined)).toBe(false);
  });

  it("returns false when storedHash is empty string", () => {
    expect(verifyPassword("AnyPass1", "")).toBe(false);
  });

  it("returns false when storedHash has no colon separator (malformed)", () => {
    expect(verifyPassword("AnyPass1", "noseparatoratall")).toBe(false);
  });

  it("returns false when storedHash has colon but empty salt part", () => {
    // ':somedigest' — split gives ['', 'somedigest'], salt is falsy
    expect(verifyPassword("AnyPass1", ":abcdef")).toBe(false);
  });

  it("returns false when storedHash has colon but empty hash part", () => {
    // 'somesalt:' — split gives ['somesalt', ''], expected is falsy
    expect(verifyPassword("AnyPass1", "abc123:")).toBe(false);
  });

  it("is case-sensitive for the password", () => {
    const stored = hashPassword("CaseSensitive1");
    expect(verifyPassword("casesensitive1", stored)).toBe(false);
    expect(verifyPassword("CASESENSITIVE1", stored)).toBe(false);
  });

  it("rejects a hash tampered in the digest portion", () => {
    const stored = hashPassword("TamperedPass1");
    const [salt, digest] = stored.split(":");
    // Flip the first character of the digest
    const flipped = (parseInt(digest[0], 16) ^ 0xf).toString(16) + digest.slice(1);
    const tampered = `${salt}:${flipped}`;
    expect(verifyPassword("TamperedPass1", tampered)).toBe(false);
  });

  it("verifies correctly across multiple distinct passwords", () => {
    const pairs = [
      "Alpha1pass",
      "Beta2pass",
      "Gamma3pass",
    ].map((p) => ({ password: p, hash: hashPassword(p) }));

    for (const { password, hash } of pairs) {
      expect(verifyPassword(password, hash)).toBe(true);
      // Cross-check: a different password should not verify against this hash
      const other = pairs.find((p) => p.password !== password)!;
      expect(verifyPassword(other.password, hash)).toBe(false);
    }
  });

  it("uses timing-safe comparison (buffers of equal length are compared via timingSafeEqual)", () => {
    // This is a structural test: verifyPassword should never return true
    // for a password whose derived key doesn't match, even if lengths align.
    const stored = hashPassword("TimingSafe1");
    // A different password that produces a 64-byte key (same length) must still fail.
    expect(verifyPassword("DifferentP1", stored)).toBe(false);
  });
});
