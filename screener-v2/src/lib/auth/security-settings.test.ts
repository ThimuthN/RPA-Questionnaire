import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    orgSecuritySettings: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import {
  getOrgSecuritySettings,
  invalidateSecuritySettingsCache,
  extractPasswordPolicy,
  type OrgSecuritySettingsData,
} from "./security-settings";

const mockFindUnique = vi.mocked(prisma.orgSecuritySettings.findUnique);

const DB_ROW: OrgSecuritySettingsData = {
  mfaEnforcement: "all",
  passwordMinLength: 12,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
  sessionDays: 14,
  lockoutThreshold: 5,
  lockoutMinutes: 60,
};

describe("getOrgSecuritySettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateSecuritySettingsCache();
    delete process.env.MFA_ENFORCEMENT;
  });

  afterEach(() => {
    invalidateSecuritySettingsCache();
    delete process.env.MFA_ENFORCEMENT;
  });

  it("returns the DB row when OrgSecuritySettings singleton row exists", async () => {
    mockFindUnique.mockResolvedValueOnce(DB_ROW as never);

    const result = await getOrgSecuritySettings();

    expect(result).toEqual(DB_ROW);
    expect(mockFindUnique).toHaveBeenCalledOnce();
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "singleton" } });
  });

  it("returns env-var defaults when DB returns null (no row)", async () => {
    process.env.MFA_ENFORCEMENT = "admins";
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getOrgSecuritySettings();

    expect(result.mfaEnforcement).toBe("admins");
    expect(result.passwordMinLength).toBe(8);
    expect(result.requireUppercase).toBe(true);
    expect(result.requireNumber).toBe(true);
    expect(result.requireSpecial).toBe(false);
    expect(result.sessionDays).toBe(7);
    expect(result.lockoutThreshold).toBe(10);
    expect(result.lockoutMinutes).toBe(30);
  });

  it("returns defaults with mfaEnforcement=off when env var not set and DB returns null", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getOrgSecuritySettings();

    expect(result.mfaEnforcement).toBe("off");
  });

  it("returns defaults when prisma throws (table not yet migrated)", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("Table orgSecuritySettings does not exist"));

    const result = await getOrgSecuritySettings();

    expect(result.passwordMinLength).toBe(8);
    expect(result.sessionDays).toBe(7);
    expect(result.lockoutThreshold).toBe(10);
  });

  it("caches result for 60 seconds — second call does not hit the DB", async () => {
    mockFindUnique.mockResolvedValue(DB_ROW as never);

    const first = await getOrgSecuritySettings();
    const second = await getOrgSecuritySettings();

    expect(first).toBe(second); // same reference — cached object
    expect(mockFindUnique).toHaveBeenCalledOnce();
  });

  it("re-queries the DB after invalidateSecuritySettingsCache()", async () => {
    mockFindUnique.mockResolvedValue(DB_ROW as never);

    await getOrgSecuritySettings();
    invalidateSecuritySettingsCache();
    await getOrgSecuritySettings();

    expect(mockFindUnique).toHaveBeenCalledTimes(2);
  });

  it("returns a fresh result after cache invalidation reflects updated DB data", async () => {
    const updatedRow: OrgSecuritySettingsData = { ...DB_ROW, sessionDays: 30 };

    mockFindUnique
      .mockResolvedValueOnce(DB_ROW as never)
      .mockResolvedValueOnce(updatedRow as never);

    const first = await getOrgSecuritySettings();
    expect(first.sessionDays).toBe(14);

    invalidateSecuritySettingsCache();

    const second = await getOrgSecuritySettings();
    expect(second.sessionDays).toBe(30);
  });

  it("caches defaults (null DB row) for 60 seconds too", async () => {
    mockFindUnique.mockResolvedValue(null);

    await getOrgSecuritySettings();
    await getOrgSecuritySettings();

    expect(mockFindUnique).toHaveBeenCalledOnce();
  });
});

describe("extractPasswordPolicy", () => {
  it("maps all settings fields to PasswordPolicy correctly", () => {
    const settings: OrgSecuritySettingsData = {
      mfaEnforcement: "off",
      passwordMinLength: 14,
      requireUppercase: true,
      requireNumber: false,
      requireSpecial: true,
      sessionDays: 7,
      lockoutThreshold: 10,
      lockoutMinutes: 30,
    };

    const policy = extractPasswordPolicy(settings);

    expect(policy).toEqual({
      minLength: 14,
      requireUppercase: true,
      requireNumber: false,
      requireSpecial: true,
    });
  });

  it("preserves false values accurately (no truthy coercion)", () => {
    const settings: OrgSecuritySettingsData = {
      mfaEnforcement: "off",
      passwordMinLength: 8,
      requireUppercase: false,
      requireNumber: false,
      requireSpecial: false,
      sessionDays: 7,
      lockoutThreshold: 10,
      lockoutMinutes: 30,
    };

    const policy = extractPasswordPolicy(settings);

    expect(policy.requireUppercase).toBe(false);
    expect(policy.requireNumber).toBe(false);
    expect(policy.requireSpecial).toBe(false);
  });

  it("does not include non-password fields (sessionDays, lockout etc.)", () => {
    const settings: OrgSecuritySettingsData = {
      mfaEnforcement: "all",
      passwordMinLength: 10,
      requireUppercase: true,
      requireNumber: true,
      requireSpecial: false,
      sessionDays: 14,
      lockoutThreshold: 5,
      lockoutMinutes: 15,
    };

    const policy = extractPasswordPolicy(settings);

    expect(Object.keys(policy)).toEqual(
      expect.arrayContaining(["minLength", "requireUppercase", "requireNumber", "requireSpecial"])
    );
    expect(policy).not.toHaveProperty("sessionDays");
    expect(policy).not.toHaveProperty("lockoutThreshold");
    expect(policy).not.toHaveProperty("lockoutMinutes");
    expect(policy).not.toHaveProperty("mfaEnforcement");
  });

  it("maps minimum-length boundary value correctly", () => {
    const settings: OrgSecuritySettingsData = {
      mfaEnforcement: "off",
      passwordMinLength: 1,
      requireUppercase: false,
      requireNumber: false,
      requireSpecial: false,
      sessionDays: 1,
      lockoutThreshold: 1,
      lockoutMinutes: 1,
    };

    const policy = extractPasswordPolicy(settings);

    expect(policy.minLength).toBe(1);
  });
});
