-- Add section plugin architecture columns to existing production schema.
-- Safe to run multiple times.

ALTER TABLE "Invite"
ADD COLUMN IF NOT EXISTS "sectionsJson" JSONB;

ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "sectionsJson" JSONB;

ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "sectionStateJson" JSONB;

ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "logicReasoningAnswerJson" JSONB;

ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "logicReasoningEarned" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "logicReasoningPossible" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "remainingLogicReasoningSeconds" INTEGER;

-- Backfill defaults for existing attempts so runtime is stable.
UPDATE "Attempt"
SET "sectionsJson" = '["core","practical"]'::jsonb
WHERE "sectionsJson" IS NULL;

ALTER TABLE "Attempt"
ALTER COLUMN "sectionsJson" SET NOT NULL;
