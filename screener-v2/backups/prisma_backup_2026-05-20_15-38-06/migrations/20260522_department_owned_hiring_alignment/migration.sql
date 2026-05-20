-- Add explicit role context and candidate finalization state.
ALTER TABLE "RoleCatalog"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "experienceLevel" TEXT,
  ADD COLUMN "requirements" TEXT;

ALTER TABLE "Candidate"
  ADD COLUMN "orgStage" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "finalizedAs" TEXT;

UPDATE "Candidate"
SET "orgStage" = 'finalized',
    "finalizedAs" = 'rejected'
WHERE "orgStatus" = 'org_rejected';

UPDATE "Candidate"
SET "orgStage" = 'finalized',
    "finalizedAs" = 'hired'
WHERE "stage" = 'closed'
  AND ("finalizedAs" IS NULL OR "finalizedAs" = '');

CREATE INDEX "Candidate_orgStage_finalizedAs_updatedAt_idx"
  ON "Candidate"("orgStage", "finalizedAs", "updatedAt");
