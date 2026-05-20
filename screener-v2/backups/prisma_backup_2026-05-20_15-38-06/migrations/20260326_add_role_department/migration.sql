ALTER TABLE "RoleCatalog"
ADD COLUMN "department" TEXT;

UPDATE "RoleCatalog"
SET "department" = CASE
  WHEN "coreBasisRoleId" IN ('Intern', 'Associate', 'SE', 'SeniorSE', 'TechLead') THEN 'Engineering'
  ELSE "department"
END
WHERE "department" IS NULL;
