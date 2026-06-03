-- Add roleType/kind to RoleCatalog to distinguish access roles from job designations
ALTER TABLE "RoleCatalog" ADD COLUMN "kind" VARCHAR(255);

-- Backfill: roles with permissions are access roles, without are job designations
UPDATE "RoleCatalog" rc
SET "kind" = CASE
  WHEN EXISTS (SELECT 1 FROM "RolePermissionTemplate" WHERE "roleId" = rc.id)
  THEN 'access_role'
  ELSE 'job_designation'
END;

-- Make kind not nullable after backfill
ALTER TABLE "RoleCatalog" ALTER COLUMN "kind" SET NOT NULL;

-- Add default for future inserts
ALTER TABLE "RoleCatalog" ALTER COLUMN "kind" SET DEFAULT 'job_designation';

-- Create AccessGrant table for user-role grants at system or department scope
CREATE TABLE "AccessGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scope" TEXT NOT NULL CHECK ("scope" IN ('system', 'department')),
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive')),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    CONSTRAINT "AccessGrant_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleCatalog" ("id") ON DELETE CASCADE,
    CONSTRAINT "AccessGrant_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX "AccessGrant_userId_idx" ON "AccessGrant" ("userId");
CREATE INDEX "AccessGrant_roleId_idx" ON "AccessGrant" ("roleId");
CREATE INDEX "AccessGrant_departmentId_idx" ON "AccessGrant" ("departmentId");
CREATE INDEX "AccessGrant_scope_status_idx" ON "AccessGrant" ("scope", "status");
CREATE INDEX "AccessGrant_userId_scope_status_idx" ON "AccessGrant" ("userId", "scope", "status");
CREATE INDEX "AccessGrant_userId_departmentId_idx" ON "AccessGrant" ("userId", "departmentId");

-- Unique constraint: prevent duplicate active grants for same user+role+scope+department
CREATE UNIQUE INDEX "AccessGrant_unique_active_grant" ON "AccessGrant" (
    "userId", "roleId", "scope", COALESCE("departmentId", ''), "status"
) WHERE "status" = 'active';
