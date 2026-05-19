export type AppAction =
  | "manage_users"
  | "create_role"
  | "edit_role"
  | "delete_role"
  | "create_job"
  | "edit_job"
  | "view_candidates"
  | "manage_candidates"
  | "promote_candidate"
  | "delete_candidate"
  | "hire_candidate"
  | "create_invite"
  | "view_results"
  | "manage_addons";

// Default permission mappings for reference
// These are now defined in RolePermissionTemplate table
// This mapping is kept for documentation purposes
export const DEFAULT_PERMISSIONS: Record<AppAction, string> = {
  manage_users: "manage_users",
  create_role: "create_role",
  edit_role: "edit_role",
  delete_role: "delete_role",
  create_job: "create_job",
  edit_job: "edit_job",
  view_candidates: "view_candidates",
  manage_candidates: "manage_candidates",
  promote_candidate: "promote_candidate",
  delete_candidate: "delete_candidate",
  hire_candidate: "hire_candidate",
  create_invite: "create_invite",
  view_results: "view_results",
  manage_addons: "manage_addons"
};
