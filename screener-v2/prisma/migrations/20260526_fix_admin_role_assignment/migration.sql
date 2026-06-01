-- Fix: Properly assign system_admin role to users without a role
-- The previous migration had flawed logic that didn't assign roles properly

-- Step 1: Ensure system_admin role exists with all permissions
INSERT INTO "RoleCatalog" (id, slug, label, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'system_admin', 'System Admin', true, 0, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Get the admin role and add all permissions if missing
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

-- Step 3: Assign system_admin role to ALL users who don't have a role
-- This ensures everyone gets admin privileges (can be demoted later via UI)
UPDATE "User"
SET "roleId" = (SELECT id FROM "RoleCatalog" WHERE slug = 'system_admin')
WHERE "roleId" IS NULL;
