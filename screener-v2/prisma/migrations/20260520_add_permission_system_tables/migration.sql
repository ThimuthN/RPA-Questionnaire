-- Create RolePermissionTemplate table for role-based permissions
CREATE TABLE "RolePermissionTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roleId" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'own_dept',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermissionTemplate_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleCatalog" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "RolePermissionTemplate_roleId_permission_key" ON "RolePermissionTemplate"("roleId", "permission");
CREATE INDEX "RolePermissionTemplate_roleId_idx" ON "RolePermissionTemplate"("roleId");

-- Create UserPermissionOverride table for per-user permission customization
CREATE TABLE "UserPermissionOverride" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "grantedBy" TEXT NOT NULL,
  "reason" TEXT,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "UserPermissionOverride_userId_permission_key" ON "UserPermissionOverride"("userId", "permission");
CREATE INDEX "UserPermissionOverride_userId_idx" ON "UserPermissionOverride"("userId");
