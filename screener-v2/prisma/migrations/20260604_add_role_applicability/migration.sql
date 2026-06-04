-- Add applicability field to RoleCatalog to distinguish system vs department scoped roles
ALTER TABLE "RoleCatalog" ADD COLUMN "applicability" VARCHAR(255) DEFAULT 'department';

-- Backfill existing roles based on system roles pattern
UPDATE "RoleCatalog"
SET "applicability" = CASE
  WHEN slug IN ('system_admin', 'department_admin', 'hiring_manager', 'recruiter', 'interviewer', 'reviewer', 'viewer')
  THEN 'system'
  ELSE 'department'
END
WHERE "applicability" IS NULL OR "applicability" = 'department';
