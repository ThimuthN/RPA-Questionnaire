-- Add missing indexes for hot-path queries to eliminate full table scans

-- Index for direct Attempt lookups by ID (used in patchAttempt, submitAttempt)
CREATE INDEX "Attempt_id_idx" ON "Attempt"("id");

-- Index for assessment version lookups (used in startAttempt)
CREATE INDEX "Attempt_assessmentVersionId_idx" ON "Attempt"("assessmentVersionId");

-- Index for result submission filtering (used in getNextUnreviewedAttemptId)
CREATE INDEX "Attempt_status_submittedAt_idx" ON "Attempt"("status", "submittedAt");

-- Index for user active status checks (used in auth layer)
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- Index for CandidateAssessment lookup by attemptId (used in assessment linking)
CREATE INDEX "CandidateAssessment_attemptId_idx" ON "CandidateAssessment"("attemptId");

-- Index for AuditLog target lookups with created timestamp
CREATE INDEX "AuditLog_targetId_createdAt_idx" ON "AuditLog"("targetId", "createdAt");
