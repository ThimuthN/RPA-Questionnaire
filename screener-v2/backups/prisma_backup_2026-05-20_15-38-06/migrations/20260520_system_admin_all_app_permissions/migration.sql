-- Keep System Admin aligned with the application permission source of truth.
WITH system_admin_roles AS (
  SELECT rc.id
  FROM "RoleCatalog" rc
  JOIN "Department" d ON d.id = rc."departmentId"
  WHERE rc.slug = 'system_admin' OR (LOWER(rc.label) = 'system admin' AND d.slug = 'system')
)
INSERT INTO "RolePermissionTemplate" (id, "roleId", permission, scope, "createdAt")
SELECT
  gen_random_uuid()::text,
  system_admin_roles.id,
  permissions.permission,
  'global',
  NOW()
FROM system_admin_roles,
(VALUES
  ('manage_users'),
  ('create_role'),
  ('edit_role'),
  ('delete_role'),
  ('create_job'),
  ('edit_job'),
  ('view_candidates'),
  ('manage_candidates'),
  ('promote_candidate'),
  ('delete_candidate'),
  ('hire_candidate'),
  ('create_invite'),
  ('view_results'),
  ('manage_addons')
) AS permissions(permission)
ON CONFLICT ("roleId", permission) DO UPDATE SET scope = 'global';

DELETE FROM "RolePermissionTemplate"
WHERE permission = 'manage_roles';
