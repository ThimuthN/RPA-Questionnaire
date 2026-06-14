export const CANDIDATE_PRIVACY_POLICY_VERSION = "2026-06-15";
export const SITE_POLICY_LAST_UPDATED = "June 15, 2026";

export function publicOrgName() {
  return process.env.NEXT_PUBLIC_ORG_NAME?.trim() || "Northstar";
}

export function publicSupportEmail() {
  return process.env.EMAIL_FROM?.trim() || "privacy@northstar.example";
}
