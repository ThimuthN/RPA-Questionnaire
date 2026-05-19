-- Phase 5: Add Scalability Columns
-- Adds uiStatus column for efficient filtering and searchVector for full-text search

-- Add uiStatus column (computed status for efficient filtering)
ALTER TABLE "Candidate" ADD COLUMN "uiStatus" TEXT NOT NULL DEFAULT 'in_progress';

-- Populate uiStatus based on finalDecision and stage
-- Logic: rejected → rejected, selected → moved_forward, on_hold → need_review, default → in_progress
UPDATE "Candidate"
SET "uiStatus" = CASE
  WHEN "finalDecision" = 'rejected' THEN 'rejected'
  WHEN "finalDecision" = 'selected' THEN 'moved_forward'
  WHEN "finalDecision" = 'on_hold' THEN 'need_review'
  WHEN "nextAction" = 'review_result' THEN 'need_review'
  ELSE 'in_progress'
END;

-- Add index for uiStatus filtering
CREATE INDEX "Candidate_uiStatus_updatedAt_idx" ON "Candidate"("uiStatus", "updatedAt");

-- Add searchVector column for full-text search (PostgreSQL tsvector)
-- This is PostgreSQL-specific; it will be skipped on other databases
ALTER TABLE "Candidate" ADD COLUMN "searchVector" tsvector;

-- Populate searchVector for existing candidates
UPDATE "Candidate"
SET "searchVector" = to_tsvector('english', "fullName" || ' ' || COALESCE("email", ''));

-- Create GIN index for efficient full-text search
CREATE INDEX "candidate_fts_idx" ON "Candidate" USING GIN("searchVector");

-- Create trigger to automatically update searchVector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION candidate_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', NEW."fullName" || ' ' || COALESCE(NEW."email", ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidate_search_vector_trigger
BEFORE INSERT OR UPDATE ON "Candidate"
FOR EACH ROW
EXECUTE FUNCTION candidate_search_vector_update();
