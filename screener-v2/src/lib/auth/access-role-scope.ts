/**
 * Determine if an access role is applicable at system or department level.
 *
 * Uses the real `applicability` field when available (preferred).
 * Falls back to role slug patterns for backward compatibility:
 * - System-applicable: system-admin, system-*, admin (if system context)
 * - Department-applicable: department-admin, hiring-manager, recruiter, interviewer, reviewer, viewer
 */

export type RoleApplicability = 'system' | 'department' | 'both';

const SYSTEM_ROLE_SLUGS = new Set([
  'system_admin',
  'system-admin',
  'system_viewer',
  'system-viewer',
  'org-admin',
  'org_admin',
  'global-hiring-admin',
  'global_hiring_admin',
  'global-viewer',
  'global_viewer'
]);

const DEPARTMENT_ROLE_SLUGS = new Set([
  'department_admin',
  'department-admin',
  'hiring_manager',
  'hiring-manager',
  'recruiter',
  'interviewer',
  'reviewer',
  'viewer'
]);

export function getRoleApplicability(role: { applicability?: string | null; slug?: string }): RoleApplicability {
  // Use explicit applicability field if available
  if (role.applicability === 'system' || role.applicability === 'department' || role.applicability === 'both') {
    return role.applicability;
  }

  // Fall back to slug inference for backward compatibility
  if (!role.slug) return 'department';

  const normalizedSlug = role.slug.toLowerCase().trim();

  if (SYSTEM_ROLE_SLUGS.has(normalizedSlug)) {
    return 'system';
  }

  if (DEPARTMENT_ROLE_SLUGS.has(normalizedSlug)) {
    return 'department';
  }

  if (normalizedSlug.includes('system') || normalizedSlug.includes('admin')) {
    return 'system';
  }

  return 'department';
}

/**
 * Filter roles by applicability based on grant scope.
 * A role is visible in a scope if its applicability matches or is 'both'.
 */
export function filterRolesByApplicability(
  roles: Array<{ applicability?: string | null; slug?: string; [key: string]: any }>,
  grantScope: 'system' | 'department'
): Array<any> {
  return roles.filter(role => {
    const applicability = getRoleApplicability(role);

    if (grantScope === 'system') {
      // System grants can use system or both roles
      return applicability === 'system' || applicability === 'both';
    } else {
      // Department grants can use department or both roles
      return applicability === 'department' || applicability === 'both';
    }
  });
}
