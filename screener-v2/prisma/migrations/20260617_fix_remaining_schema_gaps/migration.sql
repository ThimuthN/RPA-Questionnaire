-- Fix InterviewPanel.meetingUrl missing column (causes applicant detail page crash)
ALTER TABLE "InterviewPanel" ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;

-- Fix Candidate.searchVector missing column (full-text search)
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- GIN index for full-text search on searchVector
CREATE INDEX IF NOT EXISTS "candidate_fts_idx" ON "Candidate" USING GIN("searchVector");
