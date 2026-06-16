import type { AppSession } from "@/lib/auth/session";

/**
 * Org-wide MFA enforcement, configured via the MFA_ENFORCEMENT env var:
 *   "off"    — 2FA is optional (default)
 *   "admins" — required for users with admin-level permissions
 *   "all"    — required for every user
 *
 * Enforcement is applied as an enrollment wall in the authenticated layout:
 * a user who must use 2FA but hasn't enrolled is redirected to the security
 * page until they do. The wall clears automatically once mfaEnabled flips true,
 * so there is no lockout risk.
 */
export type MfaEnforcement = "off" | "admins" | "all";

const ADMIN_PERMISSIONS = ["manage_users", "manage_integrations", "manage_roles"];

export function mfaEnforcement(): MfaEnforcement {
  const value = (process.env.MFA_ENFORCEMENT ?? "off").trim().toLowerCase();
  return value === "all" || value === "admins" ? value : "off";
}

export function mfaRequiredForSession(session: Pick<AppSession, "permissions">): boolean {
  const mode = mfaEnforcement();
  if (mode === "all") return true;
  if (mode === "admins") {
    return session.permissions.some((permission) => ADMIN_PERMISSIONS.includes(permission));
  }
  return false;
}
