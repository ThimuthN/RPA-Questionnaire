import { NextResponse } from "next/server";
import type { AppSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/guards";

type PermissionCheckResult = { ok: true } | { ok: false; response: NextResponse };

export function requireCandidatePermission(
  session: AppSession,
  action: "view_candidates" | "manage_candidates"
): PermissionCheckResult {
  const result = requirePermission(session, action);
  if (!result.ok) {
    return { ok: false, response: result.response };
  }
  return { ok: true };
}
