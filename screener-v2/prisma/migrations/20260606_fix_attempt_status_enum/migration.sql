-- AttemptStatus native enum type was present in schema.prisma but never
-- created in the database. The Attempt.status column was text.
-- Prisma 6 emits ::AttemptStatus type casts on inserts which fail with
-- "type public.AttemptStatus does not exist".
--
-- Fix: create the enum, drop status-dependent indexes, alter column,
-- then recreate indexes using the enum type.
-- Safe: 0 existing rows when this migration was authored.

CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'submitted', 'graded', 'reviewed');

DROP INDEX IF EXISTS "Attempt_one_in_progress_per_invite_participant";
DROP INDEX IF EXISTS "Attempt_status_startedAt_idx";
DROP INDEX IF EXISTS "Attempt_status_submittedAt_idx";

ALTER TABLE "Attempt"
  ALTER COLUMN "status" TYPE "AttemptStatus"
  USING "status"::"AttemptStatus";

CREATE UNIQUE INDEX "Attempt_one_in_progress_per_invite_participant"
  ON "Attempt" ("inviteId", "participantId")
  WHERE (status = 'in_progress'::"AttemptStatus" AND "inviteId" IS NOT NULL);

CREATE INDEX "Attempt_status_startedAt_idx" ON "Attempt" (status, "startedAt");
CREATE INDEX "Attempt_status_submittedAt_idx" ON "Attempt" (status, "submittedAt");
