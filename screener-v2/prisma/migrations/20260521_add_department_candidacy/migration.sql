-- Phase 1: Add DepartmentCandidacy model for multi-department routing

-- Add orgStatus column to Candidate table
ALTER TABLE "Candidate" ADD COLUMN "orgStatus" TEXT NOT NULL DEFAULT 'active';

-- Create DepartmentCandidacy table
CREATE TABLE "DepartmentCandidacy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "roleId" TEXT,
    "hrOwnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "nominatedBy" TEXT,
    "nominationNote" TEXT,
    "jobPostingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DepartmentCandidacy_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE,
    CONSTRAINT "DepartmentCandidacy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE,
    CONSTRAINT "DepartmentCandidacy_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleCatalog" ("id") ON DELETE SET NULL,
    CONSTRAINT "DepartmentCandidacy_candidateId_departmentId_key" UNIQUE("candidateId", "departmentId")
);

-- Create indexes for DepartmentCandidacy
CREATE INDEX "DepartmentCandidacy_departmentId_status_updatedAt_idx" ON "DepartmentCandidacy"("departmentId", "status", "updatedAt");
CREATE INDEX "DepartmentCandidacy_candidateId_idx" ON "DepartmentCandidacy"("candidateId");
CREATE INDEX "DepartmentCandidacy_hrOwnerId_idx" ON "DepartmentCandidacy"("hrOwnerId");
CREATE INDEX "DepartmentCandidacy_jobPostingId_idx" ON "DepartmentCandidacy"("jobPostingId");

-- Backfill DepartmentCandidacy from existing Candidate.departmentId assignments
INSERT INTO "DepartmentCandidacy" (
    "id",
    "candidateId",
    "departmentId",
    "roleId",
    "hrOwnerId",
    "status",
    "source",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    c."id",
    c."departmentId",
    c."roleId",
    c."hrOwnerId",
    CASE WHEN c."finalDecision" = 'rejected' THEN 'dept_rejected' ELSE 'active' END,
    'manual',
    COALESCE(c."createdAt", CURRENT_TIMESTAMP),
    COALESCE(c."updatedAt", CURRENT_TIMESTAMP)
FROM "Candidate" c
WHERE c."departmentId" IS NOT NULL
ON CONFLICT ("candidateId", "departmentId") DO NOTHING;

-- Backfill orgStatus from finalDecision
UPDATE "Candidate" SET "orgStatus" = 'org_rejected' WHERE "finalDecision" = 'rejected';
