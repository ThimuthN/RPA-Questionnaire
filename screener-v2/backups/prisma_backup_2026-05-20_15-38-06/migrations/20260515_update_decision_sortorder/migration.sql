-- Update decision milestone sortOrder to 9999 to allow advanced_test milestones
UPDATE "CandidateMilestone" SET "sortOrder" = 9999 WHERE "type" = 'decision';
