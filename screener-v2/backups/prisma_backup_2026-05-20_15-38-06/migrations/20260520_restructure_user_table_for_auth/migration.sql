-- Restructure User table: remove accessLevel, add roleId for role-based permissions
-- This aligns the database schema with the current Prisma schema

-- Step 1: Drop the old accessLevel column and enum type
ALTER TABLE "User" DROP COLUMN IF EXISTS "accessLevel";
DROP TYPE IF EXISTS "AppAccessLevel";

-- Step 2: Add roleId FK column for role-based permissions
-- (passwordHash, isActive, lastLoginAt, updatedAt already exist from earlier migrations)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "roleId" TEXT REFERENCES "RoleCatalog"("id") ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS "User_departmentId_idx" ON "User"("departmentId");
CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");
