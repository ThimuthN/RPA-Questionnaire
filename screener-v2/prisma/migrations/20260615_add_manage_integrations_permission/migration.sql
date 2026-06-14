-- Add manage_integrations to system_admin role so integration routes are accessible.
-- The permission was used in routes since the integrations feature shipped but was
-- never seeded, meaning system_admin could not access integration management pages.
WITH system_admin_roles AS (
  SELECT rc.id
  FROM "RoleCatalog" rc
  WHERE rc.slug = 'system_admin'
)
INSERT INTO "RolePermissionTemplate" (id, "roleId", permission, scope, "createdAt")
SELECT
  gen_random_uuid()::text,
  system_admin_roles.id,
  'manage_integrations',
  'global',
  NOW()
FROM system_admin_roles
ON CONFLICT ("roleId", permission) DO UPDATE SET scope = 'global';
