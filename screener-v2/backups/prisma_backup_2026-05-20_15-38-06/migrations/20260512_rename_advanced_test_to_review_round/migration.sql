-- Rename advanced_test milestone type to review_round
UPDATE "CandidateMilestone"
SET type = 'review_round', title = 'Review round'
WHERE type = 'advanced_test';
