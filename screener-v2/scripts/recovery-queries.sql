-- Data Recovery SQL Queries
-- Run these when database connection is available

-- Step 1: Check what's actually lost
SELECT
  COUNT(*) as total_candidates,
  SUM(CASE WHEN "stage" IS NULL THEN 1 ELSE 0 END) as stage_null,
  SUM(CASE WHEN "finalDecision" IS NULL THEN 1 ELSE 0 END) as finalDecision_null,
  SUM(CASE WHEN "nextAction" IS NULL THEN 1 ELSE 0 END) as nextAction_null,
  SUM(CASE WHEN "uiStatus" IS NULL THEN 1 ELSE 0 END) as uiStatus_null,
  SUM(CASE WHEN "fullName" IS NULL THEN 1 ELSE 0 END) as fullName_null
FROM "Candidate";

-- Step 2: Recover uiStatus based on finalDecision and nextAction
UPDATE "Candidate" c
SET "uiStatus" = CASE
  WHEN c."finalDecision" = 'rejected' THEN 'rejected'
  WHEN c."finalDecision" = 'selected' THEN 'moved_forward'
  WHEN c."finalDecision" = 'on_hold' THEN 'need_review'
  WHEN c."nextAction" = 'review_result' THEN 'need_review'
  ELSE 'in_progress'
END
WHERE c."uiStatus" IS NULL OR c."uiStatus" = '';

-- Step 3: Recover stage (infer from finalDecision or default to 'screening')
UPDATE "Candidate" c
SET "stage" = CASE
  WHEN c."finalDecision" = 'rejected' THEN 'closed'
  WHEN c."finalDecision" = 'selected' THEN 'offer'
  WHEN c."stage" IS NULL THEN 'screening'
  ELSE c."stage"
END
WHERE c."stage" IS NULL OR c."stage" = '';

-- Step 4: Recover finalDecision (default to 'in_process')
UPDATE "Candidate" c
SET "finalDecision" = 'in_process'
WHERE c."finalDecision" IS NULL OR c."finalDecision" = '';

-- Step 5: Recover nextAction (default to 'none')
UPDATE "Candidate" c
SET "nextAction" = 'none'
WHERE c."nextAction" IS NULL OR c."nextAction" = '';

-- Step 6: Verify recovery
SELECT
  COUNT(*) as total_candidates,
  SUM(CASE WHEN "stage" IS NULL THEN 1 ELSE 0 END) as stage_null,
  SUM(CASE WHEN "finalDecision" IS NULL THEN 1 ELSE 0 END) as finalDecision_null,
  SUM(CASE WHEN "nextAction" IS NULL THEN 1 ELSE 0 END) as nextAction_null,
  SUM(CASE WHEN "uiStatus" IS NULL THEN 1 ELSE 0 END) as uiStatus_null
FROM "Candidate";

-- Step 7: Show sample recovered candidates
SELECT
  id,
  "fullName",
  stage,
  "finalDecision",
  "nextAction",
  "uiStatus",
  "updatedAt"
FROM "Candidate"
ORDER BY "updatedAt" DESC
LIMIT 20;
