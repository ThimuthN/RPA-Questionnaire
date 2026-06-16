import type { AppSession } from "@/lib/auth/session";
import { getOrgSecuritySettings } from "@/lib/auth/security-settings";

/**
 * Org-wide MFA enforcement. Source of truth is the OrgSecuritySettings DB row
 * (admin-configurable). Falls back to the MFA_ENFORCEMENT env var, then "off".
 *
 *   "off"    — 2FA is optional (default)
 *   "admins" — required for users with admin-level permissions
 *   "all"    — required for every user
 */
export type MfaEnforcement = "off" | "admins" | "all";

const ADMIN_PERMISSIONS = ["manage_users", "manage_integrations", "manage_roles"];

function parseEnforcement(value: string): MfaEnforcement {
  const v = value.trim().toLowerCase();
  return v === "all" || v === "admins" ? v : "off";
}

/** Sync read — env var only. Used as a fast fallback path. */
export function mfaEnforcement(): MfaEnforcement {
  return parseEnforcement(process.env.MFA_ENFORCEMENT ?? "off");
}

/** Async read — DB first, env var fallback. Use this in layouts and guards. */
export async function mfaEnforcementFromSettings(): Promise<MfaEnforcement> {
  const settings = await getOrgSecuritySettings();
  return parseEnforcement(settings.mfaEnforcement);
}

export function mfaRequiredForSession(session: Pick<AppSession, "permissions">): boolean {
  const mode = mfaEnforcement();
  if (mode === "all") return true;
  if (mode === "admins") return session.permissions.some((p) => ADMIN_PERMISSIONS.includes(p));
  return false;
}

export async function mfaRequiredForSessionAsync(session: Pick<AppSession, "permissions">): Promise<boolean> {
  const mode = await mfaEnforcementFromSettings();
  if (mode === "all") return true;
  if (mode === "admins") return session.permissions.some((p) => ADMIN_PERMISSIONS.includes(p));
  return false;
}
