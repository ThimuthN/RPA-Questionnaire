-- Create Department table
CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

-- Backfill: insert one Department per distinct non-null department string from RoleCatalog
INSERT INTO "Department" ("id", "slug", "name", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  lower(regexp_replace(TRIM(COALESCE(d.department, 'unknown')), '[^a-zA-Z0-9]+', '-', 'g')),
  TRIM(COALESCE(d.department, 'unknown')),
  true,
  (ROW_NUMBER() OVER (ORDER BY d.department))::int,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "department" FROM "RoleCatalog" WHERE "department" IS NOT NULL AND "department" <> '') d
UNION ALL
SELECT
  gen_random_uuid()::text,
  'unknown',
  'unknown',
  true,
  999,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "department" FROM "RoleCatalog" WHERE "department" IS NOT NULL AND "department" <> '') d);

-- Add FK columns to RoleCatalog
ALTER TABLE "RoleCatalog" ADD COLUMN "departmentId" TEXT REFERENCES "Department"("id") ON DELETE SET NULL;

-- Add FK columns to User
ALTER TABLE "User" ADD COLUMN "departmentId" TEXT REFERENCES "Department"("id") ON DELETE SET NULL;

-- Add FK columns to Candidate
ALTER TABLE "Candidate" ADD COLUMN "departmentId" TEXT REFERENCES "Department"("id") ON DELETE SET NULL;
ALTER TABLE "Candidate" ADD COLUMN "hrOwnerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

-- Add FK columns to JobPosting
ALTER TABLE "JobPosting" ADD COLUMN "departmentId" TEXT REFERENCES "Department"("id") ON DELETE SET NULL;

-- Backfill RoleCatalog.departmentId from existing department string
UPDATE "RoleCatalog" r
SET "departmentId" = d."id"
FROM "Department" d
WHERE TRIM(r."department") = d."name" AND r."department" IS NOT NULL;

-- For roles with null department, assign to 'unknown'
UPDATE "RoleCatalog" r
SET "departmentId" = d."id"
FROM "Department" d
WHERE d."slug" = 'unknown' AND r."departmentId" IS NULL;

-- Backfill Candidate.departmentId from their linked role's departmentId
UPDATE "Candidate" c
SET "departmentId" = r."departmentId"
FROM "RoleCatalog" r
WHERE c."roleId" = r."id" AND r."departmentId" IS NOT NULL;

-- Backfill JobPosting.departmentId from their linked role's departmentId
UPDATE "JobPosting" j
SET "departmentId" = r."departmentId"
FROM "RoleCatalog" r
WHERE j."roleId" = r."id" AND r."departmentId" IS NOT NULL;

-- Indexes
CREATE INDEX "Department_isActive_sortOrder_idx" ON "Department"("isActive", "sortOrder");
CREATE INDEX "RoleCatalog_departmentId_idx" ON "RoleCatalog"("departmentId");
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");
CREATE INDEX "Candidate_departmentId_idx" ON "Candidate"("departmentId");
CREATE INDEX "Candidate_hrOwnerId_idx" ON "Candidate"("hrOwnerId");
CREATE INDEX "JobPosting_departmentId_idx" ON "JobPosting"("departmentId");
