-- Normalize legacy stage value "new" to "pipeline"
-- The "new" stage was an early alias for "pipeline" before the stage enum was finalized.
-- All downstream code treats "new" as "pipeline"; this migration makes the DB consistent.
UPDATE "Candidate" SET "stage" = 'pipeline' WHERE "stage" = 'new';
