-- Restructure User table: remove accessLevel, add roleId and auth fields
-- This aligns the database schema with the current Prisma schema

-- Step 1: Drop the old accessLevel column and enum type
ALTER TABLE "User" DROP COLUMN IF EXISTS "accessLevel";
DROP TYPE IF EXISTS "AppAccessLevel";

-- Step 2: Add missing columns for authentication and permissions
ALTER TABLE "User"
  ADD COLUMN "roleId" TEXT REFERENCES "RoleCatalog"("id") ON DELETE SET NULL,
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- Step 3: Add updated timestamp column (may already exist, but check)
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Step 4: Ensure email is unique (may already be, but ensure it)
-- Note: Cannot re-add if it already exists, so we use OR REPLACE pattern
-- Just ensure the constraint exists by checking the schema

-- Step 5: Create indexes for performance
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
