-- Persist the chosen pass target so scoring remains stable after test creation.
-- Safe to run multiple times.

ALTER TABLE "Invite"
ADD COLUMN IF NOT EXISTS "passTargetPercent" INTEGER;

ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "passTargetPercent" INTEGER;

UPDATE "Invite"
SET "passTargetPercent" = CASE
  WHEN "roleId" = 'Intern' THEN 55
  WHEN "roleId" = 'Associate' THEN 60
  WHEN "roleId" = 'SE' THEN 66
  WHEN "roleId" = 'SeniorSE' THEN 72
  WHEN "roleId" = 'TechLead' THEN 78
  ELSE 60
END
WHERE "passTargetPercent" IS NULL;

UPDATE "Attempt"
SET "passTargetPercent" = CASE
  WHEN "roleId" = 'Intern' THEN 55
  WHEN "roleId" = 'Associate' THEN 60
  WHEN "roleId" = 'SE' THEN 66
  WHEN "roleId" = 'SeniorSE' THEN 72
  WHEN "roleId" = 'TechLead' THEN 78
  ELSE 60
END
WHERE "passTargetPercent" IS NULL;

ALTER TABLE "Attempt"
ALTER COLUMN "passTargetPercent" SET NOT NULL;
