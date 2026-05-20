-- REVERSE DATABASE MIGRATIONS: Restore May 18 state
-- Execute this SQL in your Neon SQL Editor to complete the rollback
-- Generated: 2026-05-20 15:45 UTC+5:30

-- 1. Reverse: 20260522_department_owned_hiring_alignment
ALTER TABLE "RoleCatalog" DROP COLUMN IF EXISTS "description";

-- 2. Reverse: 20260521_add_department_model
DROP TABLE IF EXISTS "Department" CASCADE;

-- 3. Reverse: 20260521_add_department_candidacy
ALTER TABLE "Candidate" DROP COLUMN IF EXISTS "orgStatus";
DROP TABLE IF EXISTS "DepartmentCandidacy" CASCADE;

-- 4. Reverse: 20260520_phase2_drop_legacy_candidate_fields
-- Restore columns that were dropped
ALTER TABLE "Candidate"
  ADD COLUMN IF NOT EXISTS "intakeBucket" TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS "finalDecision" TEXT,
  ADD COLUMN IF NOT EXISTS "uiStatus" TEXT DEFAULT 'in_progress';

-- 5. Reverse: 20260520_phase1_remove_redundant_user_fields
-- Restore columns that were removed
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- 6. Reverse: 20260520_restructure_user_table_for_auth
-- Restore accessLevel, remove roleId
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "roleId",
  ADD COLUMN IF NOT EXISTS "accessLevel" TEXT DEFAULT 'member';

-- 7. Reverse: 20260520_add_permission_system_tables
DROP TABLE IF EXISTS "RolePermissionTemplate" CASCADE;

-- 8. Reverse: 20260520_add_missing_indexes
DROP INDEX IF EXISTS idx_interview_panel_interviewer;
DROP INDEX IF EXISTS idx_interview_panel_candidate;
DROP INDEX IF EXISTS idx_candidate_offer_candidate;
DROP INDEX IF EXISTS idx_candidate_offer_interviewer;
DROP INDEX IF EXISTS idx_attempt_id;
DROP INDEX IF EXISTS idx_attempt_candidateId;

-- 9. Reverse: 20260519_add_offer_system
DROP TABLE IF EXISTS "CandidateOffer" CASCADE;

-- 10. Reverse: 20260519_add_interview_system
DROP TABLE IF EXISTS "InterviewPanel" CASCADE;
DROP TABLE IF EXISTS "InterviewPanelMember" CASCADE;

-- 11. Reverse: 20260519_add_compound_index_scalability
DROP INDEX IF EXISTS idx_candidate_intakebucket_stage_updatedat;

-- Analyze to update statistics
ANALYZE;

-- COMPLETION MESSAGE
-- If all statements executed without errors, your database is restored to May 18 state
-- The application code has already been reverted to May 18
-- Next: Verify the application is working at https://your-vercel-domain
