-- Add applicability field to RoleCatalog to distinguish system vs department scoped roles
ALTER TABLE "RoleCatalog" ADD COLUMN "applicability" VARCHAR(255) DEFAULT 'department';

-- Backfill existing roles based on system roles pattern
-- Only system_admin is system-scoped; all others are department-scoped
UPDATE "RoleCatalog"
SET "applicability" = CASE
  WHEN slug IN ('system_admin', 'system-admin')
  THEN 'system'
  ELSE 'department'
END
WHERE "applicability" IS NULL OR "applicability" = 'department';
