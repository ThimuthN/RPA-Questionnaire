DELETE FROM "Result"
WHERE NOT EXISTS (
  SELECT 1
  FROM "Attempt"
  WHERE "Attempt"."id" = "Result"."attemptId"
);

UPDATE "Attempt"
SET "inviteId" = NULL
WHERE "inviteId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Invite"
    WHERE "Invite"."id" = "Attempt"."inviteId"
  );

DELETE FROM "Attempt"
WHERE NOT EXISTS (
  SELECT 1
  FROM "Participant"
  WHERE "Participant"."id" = "Attempt"."participantId"
);

DELETE FROM "Result"
WHERE NOT EXISTS (
  SELECT 1
  FROM "Attempt"
  WHERE "Attempt"."id" = "Result"."attemptId"
);

WITH ranked_resumes AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "candidateId", "storageKey"
      ORDER BY "uploadedAt" DESC, "id" DESC
    ) AS row_number
  FROM "CandidateResume"
)
DELETE FROM "CandidateResume"
WHERE "id" IN (
  SELECT "id"
  FROM ranked_resumes
  WHERE row_number > 1
);

ALTER TABLE "Attempt"
ADD CONSTRAINT "Attempt_inviteId_fkey"
FOREIGN KEY ("inviteId") REFERENCES "Invite"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Attempt"
ADD CONSTRAINT "Attempt_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "Participant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Result"
ADD CONSTRAINT "Result_attemptId_fkey"
FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CandidateResume_candidateId_storageKey_key"
ON "CandidateResume"("candidateId", "storageKey");
