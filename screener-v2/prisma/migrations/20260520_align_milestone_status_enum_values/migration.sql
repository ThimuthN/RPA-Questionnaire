-- Migrate CandidateMilestoneStatus enum values from old schema to new schema
-- This fixes a data consistency issue where the schema was changed but data wasn't migrated

-- Mapping:
-- pending -> not_started
-- completed -> done
-- passed -> done
-- in_progress -> in_progress (no change)
-- failed -> failed (no change)

UPDATE "CandidateMilestone" SET status = 'not_started' WHERE status = 'pending';
UPDATE "CandidateMilestone" SET status = 'done' WHERE status IN ('completed', 'passed');
UPDATE "MilestoneCheck" SET status = 'not_started' WHERE status = 'pending';
UPDATE "MilestoneCheck" SET status = 'done' WHERE status IN ('completed', 'passed');
