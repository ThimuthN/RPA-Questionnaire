import type { AppAccessLevel } from "@/lib/auth/session";

export type AppAction =
  | "manage_users"
  | "create_role"
  | "edit_role"
  | "delete_role"
  | "create_job"
  | "edit_job"
  | "view_candidates"
  | "manage_candidates"
  | "create_invite"
  | "view_results"
  | "manage_addons";

const PERMISSIONS: Record<AppAction, AppAccessLevel[]> = {
  manage_users: ["admin"],
  create_role: ["admin", "recruiter"],
  edit_role: ["admin", "recruiter"],
  delete_role: ["admin"],
  create_job: ["admin", "recruiter", "hiring_manager"],
  edit_job: ["admin", "recruiter", "hiring_manager"],
  view_candidates: ["admin", "recruiter", "hiring_manager"],
  manage_candidates: ["admin", "recruiter"],
  create_invite: ["admin", "recruiter", "hiring_manager"],
  view_results: ["admin", "recruiter", "hiring_manager", "interviewer"],
  manage_addons: ["admin"]
};

export function can(accessLevel: AppAccessLevel, action: AppAction): boolean {
  return PERMISSIONS[action]?.includes(accessLevel) ?? false;
}
