-- Standardize candidate stages and milestone types
-- Maps old terminology to new canonical names:
-- "testing" -> "advanced_review", "decision" -> "finalized", "closed" -> "finalized"
-- "advanced_test" -> "advanced_review"

-- Rename stage values in Candidate table
UPDATE "Candidate" SET stage = 'advanced_review' WHERE stage = 'testing';
UPDATE "Candidate" SET stage = 'finalized' WHERE stage = 'decision';
UPDATE "Candidate" SET stage = 'finalized' WHERE stage = 'closed';

-- Rename milestone type values in CandidateMilestone table
UPDATE "CandidateMilestone" SET type = 'advanced_review' WHERE type = 'advanced_test';
UPDATE "CandidateMilestone" SET type = 'finalized', title = 'Finalized' WHERE type = 'decision';
