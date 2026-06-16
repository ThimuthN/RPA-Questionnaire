import { prisma } from "@/lib/db/prisma";
import type { PasswordPolicy } from "@/lib/auth/password";

export interface OrgSecuritySettingsData {
  mfaEnforcement: string;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  sessionDays: number;
  lockoutThreshold: number;
  lockoutMinutes: number;
}

function buildDefaults(): OrgSecuritySettingsData {
  return {
    mfaEnforcement: process.env.MFA_ENFORCEMENT?.trim().toLowerCase() ?? "off",
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: false,
    sessionDays: 7,
    lockoutThreshold: 10,
    lockoutMinutes: 30,
  };
}

// 60-second module-level cache — avoids a DB round-trip on every auth request
let _cached: OrgSecuritySettingsData | null = null;
let _cacheExpiry = 0;

export async function getOrgSecuritySettings(): Promise<OrgSecuritySettingsData> {
  const now = Date.now();
  if (_cached && _cacheExpiry > now) return _cached;

  try {
    const row = await prisma.orgSecuritySettings.findUnique({ where: { id: "singleton" } });
    if (row) {
      _cached = {
        mfaEnforcement: row.mfaEnforcement,
        passwordMinLength: row.passwordMinLength,
        requireUppercase: row.requireUppercase,
        requireNumber: row.requireNumber,
        requireSpecial: row.requireSpecial,
        sessionDays: row.sessionDays,
        lockoutThreshold: row.lockoutThreshold,
        lockoutMinutes: row.lockoutMinutes,
      };
      _cacheExpiry = now + 60_000;
      return _cached;
    }
  } catch {
    // Table not yet migrated in dev — fall through to defaults
  }

  const defaults = buildDefaults();
  _cached = defaults;
  _cacheExpiry = now + 60_000;
  return defaults;
}

export function invalidateSecuritySettingsCache(): void {
  _cached = null;
  _cacheExpiry = 0;
}

export function extractPasswordPolicy(settings: OrgSecuritySettingsData): PasswordPolicy {
  return {
    minLength: settings.passwordMinLength,
    requireUppercase: settings.requireUppercase,
    requireNumber: settings.requireNumber,
    requireSpecial: settings.requireSpecial,
  };
}
