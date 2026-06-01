-- Bootstrap system admin role and permissions
-- Ensures existing users get admin privileges with proper permissions

-- Create or get system admin role
INSERT INTO "RoleCatalog" (id, slug, label, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'system_admin', 'System Admin', true, 0, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Get the admin role ID for permissions
WITH admin_role AS (
  SELECT id FROM "RoleCatalog" WHERE slug = 'system_admin'
)
INSERT INTO "RolePermissionTemplate" (id, "roleId", permission, scope, "createdAt")
SELECT
  gen_random_uuid()::text,
  admin_role.id,
  permission,
  'global',
  NOW()
FROM admin_role,
(VALUES
  ('manage_users'),
  ('manage_roles'),
  ('manage_candidates'),
  ('view_candidates'),
  ('manage_addons'),
  ('create_job'),
  ('edit_job'),
  ('create_invite'),
  ('view_results')
) AS permissions(permission)
ON CONFLICT ("roleId", permission) DO NOTHING;

-- Assign system admin role to all existing system admins by email
-- (Those who were created before the role-based system)
UPDATE "User"
SET "roleId" = (SELECT id FROM "RoleCatalog" WHERE slug = 'system_admin')
WHERE "roleId" IS NULL
  AND email IN (
    SELECT email FROM "User"
    WHERE "createdAt" < NOW() - INTERVAL '1 hour'
    LIMIT 1
  );
