-- SC4: additive composite indexes for query-performance hot paths

-- CandidateActivityEvent: filter by event type within a candidate's timeline
CREATE INDEX IF NOT EXISTS "CandidateActivityEvent_candidateId_event_createdAt_idx"
  ON "CandidateActivityEvent" ("candidateId", "event", "createdAt");

-- InterviewFeedback: fetch submitted feedback for a panel sorted by submission time
CREATE INDEX IF NOT EXISTS "InterviewFeedback_panelId_submittedAt_idx"
  ON "InterviewFeedback" ("panelId", "submittedAt");

-- EmailLog: admin queries filtering on delivery status + time window
CREATE INDEX IF NOT EXISTS "EmailLog_status_sentAt_idx"
  ON "EmailLog" ("status", "sentAt");

-- Candidate: board and list queries filtering active candidates by stage + department
CREATE INDEX IF NOT EXISTS "Candidate_stage_departmentId_orgStage_idx"
  ON "Candidate" ("stage", "departmentId", "orgStage");
