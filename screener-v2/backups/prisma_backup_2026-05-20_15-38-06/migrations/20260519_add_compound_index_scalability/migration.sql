-- Add compound index for efficient filtering by intakeBucket + stage combination
-- Used in listCandidateWorkspacePage and stage-counts queries
CREATE INDEX idx_candidate_intakebucket_stage_updatedat ON "Candidate"("intakeBucket", "stage", "updatedAt");
