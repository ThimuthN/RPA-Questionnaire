-- Preflight duplicate check:
-- SELECT "inviteId", "participantId", count(*) AS duplicate_count
-- FROM "Attempt"
-- WHERE "status" = 'in_progress' AND "inviteId" IS NOT NULL
-- GROUP BY "inviteId", "participantId"
-- HAVING count(*) > 1;

CREATE UNIQUE INDEX "Attempt_one_in_progress_per_invite_participant"
ON "Attempt" ("inviteId", "participantId")
WHERE "status" = 'in_progress' AND "inviteId" IS NOT NULL;
