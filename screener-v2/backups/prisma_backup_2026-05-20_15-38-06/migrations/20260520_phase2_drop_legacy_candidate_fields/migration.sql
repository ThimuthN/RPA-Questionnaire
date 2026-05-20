-- Phase 2: Drop legacy candidate status fields
-- intakeBucket, finalDecision, and uiStatus are replaced by single 'stage' field
-- These columns were added in early migrations but are no longer used

-- Drop indexes that reference these columns
DROP INDEX IF EXISTS "candidate_intakeBucket_updatedAt_idx";
DROP INDEX IF EXISTS "candidate_intakeBucket_stage_updatedAt_idx";
DROP INDEX IF EXISTS "candidate_finalDecision_stage_updatedAt_idx";
DROP INDEX IF EXISTS "candidate_uiStatus_updatedAt_idx";
DROP INDEX IF EXISTS "idx_candidate_intakebucket_stage_updatedat";
DROP INDEX IF EXISTS "Candidate_finalDecision_stage_updatedAt_idx";

-- Drop the legacy columns
ALTER TABLE "Candidate" DROP COLUMN IF EXISTS "intakeBucket";
ALTER TABLE "Candidate" DROP COLUMN IF EXISTS "finalDecision";
ALTER TABLE "Candidate" DROP COLUMN IF EXISTS "uiStatus";
