import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/auth/security-settings", () => ({
  getOrgSecuritySettings: vi.fn(),
}));

import { getOrgSecuritySettings } from "@/lib/auth/security-settings";
import {
  mfaEnforcement,
  mfaEnforcementFromSettings,
  mfaRequiredForSession,
  mfaRequiredForSessionAsync,
  type MfaEnforcement,
} from "./mfa-policy";
import type { AppSession } from "@/lib/auth/session";

const mockGetOrgSecuritySettings = vi.mocked(getOrgSecuritySettings);

function makeSession(permissions: string[]): Pick<AppSession, "permissions"> {
  return { permissions };
}

function makeSettings(mfaEnforcementValue: string) {
  return {
    mfaEnforcement: mfaEnforcementValue,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: false,
    sessionDays: 7,
    lockoutThreshold: 10,
    lockoutMinutes: 30,
  };
}

describe("mfaEnforcement (sync, env var only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MFA_ENFORCEMENT;
  });

  afterEach(() => {
    delete process.env.MFA_ENFORCEMENT;
  });

  it('returns "off" when MFA_ENFORCEMENT is not set', () => {
    expect(mfaEnforcement()).toBe("off");
  });

  it('returns "all" when MFA_ENFORCEMENT=all', () => {
    process.env.MFA_ENFORCEMENT = "all";
    expect(mfaEnforcement()).toBe("all");
  });

  it('returns "admins" when MFA_ENFORCEMENT=admins', () => {
    process.env.MFA_ENFORCEMENT = "admins";
    expect(mfaEnforcement()).toBe("admins");
  });

  it('returns "off" for unrecognised values', () => {
    process.env.MFA_ENFORCEMENT = "required";
    expect(mfaEnforcement()).toBe("off");
  });

  it('returns "off" for empty string', () => {
    process.env.MFA_ENFORCEMENT = "";
    expect(mfaEnforcement()).toBe("off");
  });

  it("is case-insensitive (ALL, ADMINS)", () => {
    process.env.MFA_ENFORCEMENT = "ALL";
    expect(mfaEnforcement()).toBe("all");

    process.env.MFA_ENFORCEMENT = "ADMINS";
    expect(mfaEnforcement()).toBe("admins");
  });

  it("trims leading/trailing whitespace before parsing", () => {
    process.env.MFA_ENFORCEMENT = "  all  ";
    expect(mfaEnforcement()).toBe("all");
  });
});

describe("mfaRequiredForSession (sync)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MFA_ENFORCEMENT;
  });

  afterEach(() => {
    delete process.env.MFA_ENFORCEMENT;
  });

  it('returns false for any session when mode is "off"', () => {
    process.env.MFA_ENFORCEMENT = "off";
    expect(mfaRequiredForSession(makeSession(["manage_users"]))).toBe(false);
    expect(mfaRequiredForSession(makeSession([]))).toBe(false);
  });

  it('returns true for any session when mode is "all"', () => {
    process.env.MFA_ENFORCEMENT = "all";
    expect(mfaRequiredForSession(makeSession([]))).toBe(true);
    expect(mfaRequiredForSession(makeSession(["view_jobs"]))).toBe(true);
    expect(mfaRequiredForSession(makeSession(["manage_users"]))).toBe(true);
  });

  it('returns true for manage_users permission when mode is "admins"', () => {
    process.env.MFA_ENFORCEMENT = "admins";
    expect(mfaRequiredForSession(makeSession(["manage_users"]))).toBe(true);
  });

  it('returns true for manage_roles permission when mode is "admins"', () => {
    process.env.MFA_ENFORCEMENT = "admins";
    expect(mfaRequiredForSession(makeSession(["manage_roles"]))).toBe(true);
  });

  it('returns true for manage_integrations permission when mode is "admins"', () => {
    process.env.MFA_ENFORCEMENT = "admins";
    expect(mfaRequiredForSession(makeSession(["manage_integrations"]))).toBe(true);
  });

  it('returns true when session has one admin permission among non-admin ones in "admins" mode', () => {
    process.env.MFA_ENFORCEMENT = "admins";
    expect(mfaRequiredForSession(makeSession(["view_jobs", "manage_users", "view_candidates"]))).toBe(true);
  });

  it('returns false for non-admin permissions only when mode is "admins"', () => {
    process.env.MFA_ENFORCEMENT = "admins";
    expect(mfaRequiredForSession(makeSession(["view_jobs"]))).toBe(false);
    expect(mfaRequiredForSession(makeSession(["view_candidates"]))).toBe(false);
    expect(mfaRequiredForSession(makeSession(["create_job"]))).toBe(false);
  });

  it('returns false for empty permissions array when mode is "admins"', () => {
    process.env.MFA_ENFORCEMENT = "admins";
    expect(mfaRequiredForSession(makeSession([]))).toBe(false);
  });
});

describe("mfaRequiredForSessionAsync (DB-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MFA_ENFORCEMENT;
  });

  afterEach(() => {
    delete process.env.MFA_ENFORCEMENT;
  });

  it("reads enforcement from DB, not from env var", async () => {
    // env says off, DB says all — DB should win
    process.env.MFA_ENFORCEMENT = "off";
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("all"));

    const result = await mfaRequiredForSessionAsync(makeSession([]));

    expect(result).toBe(true);
    expect(mockGetOrgSecuritySettings).toHaveBeenCalledOnce();
  });

  it('returns false when DB says "off"', async () => {
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("off"));

    const result = await mfaRequiredForSessionAsync(makeSession(["manage_users"]));

    expect(result).toBe(false);
  });

  it('returns true for any session when DB says "all"', async () => {
    mockGetOrgSecuritySettings.mockResolvedValue(makeSettings("all"));

    expect(await mfaRequiredForSessionAsync(makeSession([]))).toBe(true);
    expect(await mfaRequiredForSessionAsync(makeSession(["view_jobs"]))).toBe(true);
    expect(await mfaRequiredForSessionAsync(makeSession(["manage_users"]))).toBe(true);
  });

  it('returns true for admin permissions when DB says "admins"', async () => {
    mockGetOrgSecuritySettings.mockResolvedValue(makeSettings("admins"));

    expect(await mfaRequiredForSessionAsync(makeSession(["manage_users"]))).toBe(true);
    expect(await mfaRequiredForSessionAsync(makeSession(["manage_roles"]))).toBe(true);
    expect(await mfaRequiredForSessionAsync(makeSession(["manage_integrations"]))).toBe(true);
  });

  it('returns false for non-admin permissions when DB says "admins"', async () => {
    mockGetOrgSecuritySettings.mockResolvedValue(makeSettings("admins"));

    expect(await mfaRequiredForSessionAsync(makeSession(["view_jobs"]))).toBe(false);
    expect(await mfaRequiredForSessionAsync(makeSession(["create_job"]))).toBe(false);
    expect(await mfaRequiredForSessionAsync(makeSession([]))).toBe(false);
  });

  it('returns false when DB returns an unrecognised enforcement value (falls back to "off")', async () => {
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("strict"));

    const result = await mfaRequiredForSessionAsync(makeSession(["manage_users"]));

    expect(result).toBe(false);
  });
});

describe("mfaEnforcementFromSettings (async, DB-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MFA_ENFORCEMENT;
  });

  afterEach(() => {
    delete process.env.MFA_ENFORCEMENT;
  });

  it('returns "all" when DB row has mfaEnforcement="all"', async () => {
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("all"));

    const result = await mfaEnforcementFromSettings();

    expect(result).toBe("all");
  });

  it('returns "admins" when DB row has mfaEnforcement="admins"', async () => {
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("admins"));

    const result = await mfaEnforcementFromSettings();

    expect(result).toBe("admins");
  });

  it('returns "off" when DB row has mfaEnforcement="off"', async () => {
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("off"));

    const result = await mfaEnforcementFromSettings();

    expect(result).toBe("off");
  });

  it('returns "off" when DB returns an invalid enforcement string', async () => {
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("invalid-value"));

    const result = await mfaEnforcementFromSettings();

    expect(result).toBe("off");
  });

  it("calls getOrgSecuritySettings exactly once per invocation", async () => {
    mockGetOrgSecuritySettings.mockResolvedValueOnce(makeSettings("off"));

    await mfaEnforcementFromSettings();

    expect(mockGetOrgSecuritySettings).toHaveBeenCalledOnce();
  });
});
