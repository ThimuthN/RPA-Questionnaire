-- CandidateMilestoneStatus native enum was defined in schema.prisma but never
-- created in the database. CandidateMilestone.status was stored as TEXT.
-- Prisma 6 emits ::CandidateMilestoneStatus type casts on writes which fail with
-- "type public.CandidateMilestoneStatus does not exist".
--
-- Fix: sanitize any remaining legacy text values, create the enum type,
-- then alter the column. No status-based indexes exist on this table so
-- no index drop/recreate is needed.
-- Mirrors the pattern used in 20260606_fix_attempt_status_enum.

-- Coerce any remaining pre-migration text values to a valid enum member
-- (20260520_align_milestone_status_enum_values already handles pending/completed/passed
-- for rows that existed at that time; this guard covers edge cases and test data)
UPDATE "CandidateMilestone"
  SET status = 'not_started'
  WHERE status NOT IN ('not_started', 'in_progress', 'done', 'failed', 'skipped');

CREATE TYPE "CandidateMilestoneStatus" AS ENUM ('not_started', 'in_progress', 'done', 'failed', 'skipped');

ALTER TABLE "CandidateMilestone"
  ALTER COLUMN "status" TYPE "CandidateMilestoneStatus"
  USING "status"::"CandidateMilestoneStatus";
