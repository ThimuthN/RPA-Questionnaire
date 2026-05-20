-- Phase 5: Consolidate to real departments only and make roles department-scoped

-- 1. Ensure System department exists
INSERT INTO "Department" (id, name, slug, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES ('system-dept', 'System', 'system', true, 0, NOW(), NOW())
ON CONFLICT(slug) DO UPDATE SET "updatedAt" = NOW();

-- 2. Delete all Test departments and their roles
DELETE FROM "RoleCatalog" 
WHERE "departmentId" IN (
  SELECT id FROM "Department" WHERE slug LIKE 'test%' OR name LIKE '%Test%'
);

DELETE FROM "Department" 
WHERE slug LIKE 'test%' OR name LIKE '%Test%';

-- 3. Assign unassigned roles to appropriate departments
-- System/Admin roles → System department
UPDATE "RoleCatalog"
SET "departmentId" = 'system-dept'
WHERE "departmentId" IS NULL 
  AND (label ILIKE '%system%' OR label ILIKE '%admin%');

-- Engineering roles → Engineering IND (or SL if available)
UPDATE "RoleCatalog"
SET "departmentId" = (
  SELECT id FROM "Department" WHERE slug = 'engineering-ind' LIMIT 1
)
WHERE "departmentId" IS NULL
  AND (label ILIKE '%engineer%' OR label ILIKE '%lead%' OR label ILIKE '%python%');

-- RPA roles → RPA IND
UPDATE "RoleCatalog"
SET "departmentId" = (
  SELECT id FROM "Department" WHERE slug = 'rpa-ind' LIMIT 1
)
WHERE "departmentId" IS NULL
  AND (label ILIKE '%rpa%' OR label ILIKE '%uipath%');

-- Remaining unassigned → System
UPDATE "RoleCatalog"
SET "departmentId" = 'system-dept'
WHERE "departmentId" IS NULL;

-- 4. Delete test roles
DELETE FROM "RoleCatalog"
WHERE label = 'Test Role' OR label ILIKE '%test%';

-- 5. Make departmentId NOT NULL (enforce department scoping)
ALTER TABLE "RoleCatalog" ALTER COLUMN "departmentId" SET NOT NULL;
