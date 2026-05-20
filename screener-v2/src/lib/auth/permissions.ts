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

export const APP_ACTIONS: AppAction[] = [
  "manage_users",
  "create_role",
  "edit_role",
  "delete_role",
  "create_job",
  "edit_job",
  "view_candidates",
  "manage_candidates",
  "promote_candidate",
  "delete_candidate",
  "hire_candidate",
  "create_invite",
  "view_results",
  "manage_addons"
];

export const APP_ACTION_LABELS: Record<AppAction, string> = {
  manage_users: "Manage users",
  create_role: "Create roles",
  edit_role: "Edit roles",
  delete_role: "Delete roles",
  create_job: "Create jobs",
  edit_job: "Edit jobs",
  view_candidates: "View candidates",
  manage_candidates: "Manage candidates",
  promote_candidate: "Move candidates",
  delete_candidate: "Delete candidates",
  hire_candidate: "Hire candidates",
  create_invite: "Create invites",
  view_results: "View results",
  manage_addons: "Manage add-ons"
};

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
