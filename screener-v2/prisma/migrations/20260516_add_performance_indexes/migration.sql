-- Add composite index for candidate filtering
CREATE INDEX "Candidate_finalDecision_stage_updatedAt_idx" ON "Candidate"("finalDecision", "stage", "updatedAt");

-- Add index for candidate text search
CREATE INDEX "Candidate_fullName_idx" ON "Candidate"("fullName");

-- Add composite index for result dashboard filtering
CREATE INDEX "Result_contextType_reviewState_createdAt_idx" ON "Result"("contextType", "reviewState", "createdAt");

-- Add index for magic token cleanup queries
CREATE INDEX "MagicToken_expiresAt_idx" ON "MagicToken"("expiresAt");
