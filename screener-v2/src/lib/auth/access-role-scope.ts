/**
 * Determine if an access role is applicable at system or department level.
 *
 * Applicability is determined by role slug patterns:
 * - System-applicable: system-admin, system-*, admin (if system context)
 * - Department-applicable: department-admin, hiring-manager, recruiter, interviewer, reviewer, viewer
 *
 * This allows for accurate role filtering even though the schema requires departmentId.
 */

export type RoleApplicability = 'system' | 'department';

const SYSTEM_ROLE_SLUGS = new Set([
  'system-admin',
  'system_admin',  // Handle variant spelling
  'system-viewer',
  'org-admin',
  'global-hiring-admin',
  'global-viewer'
]);

const DEPARTMENT_ROLE_SLUGS = new Set([
  'department-admin',
  'hiring-manager',
  'recruiter',
  'interviewer',
  'reviewer',
  'viewer'
]);

export function getRoleApplicability(slug: string): RoleApplicability {
  const normalizedSlug = slug.toLowerCase().trim();

  // Check explicit system roles
  if (SYSTEM_ROLE_SLUGS.has(normalizedSlug)) {
    return 'system';
  }

  // Check explicit department roles
  if (DEPARTMENT_ROLE_SLUGS.has(normalizedSlug)) {
    return 'department';
  }

  // Default: if slug contains 'system', it's system; otherwise department
  if (normalizedSlug.includes('system') || normalizedSlug.includes('admin')) {
    return 'system';
  }

  return 'department';
}

/**
 * Filter roles by applicability
 */
export function filterRolesByApplicability(
  roles: Array<{ slug: string; [key: string]: any }>,
  applicability: RoleApplicability
) {
  return roles.filter(role => getRoleApplicability(role.slug) === applicability);
}
