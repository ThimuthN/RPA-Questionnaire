ALTER TABLE "Attempt"
ADD COLUMN IF NOT EXISTS "stateVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "CandidateAssessmentAttempt" (
    "id" TEXT NOT NULL,
    "candidateAssessmentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateAssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CandidateAssessmentAttempt_attemptId_key"
ON "CandidateAssessmentAttempt"("attemptId");

CREATE UNIQUE INDEX IF NOT EXISTS "CandidateAssessmentAttempt_candidateAssessmentId_attemptId_key"
ON "CandidateAssessmentAttempt"("candidateAssessmentId", "attemptId");

CREATE INDEX IF NOT EXISTS "CandidateAssessmentAttempt_candidateAssessmentId_linkedAt_idx"
ON "CandidateAssessmentAttempt"("candidateAssessmentId", "linkedAt");

ALTER TABLE "CandidateAssessmentAttempt"
ADD CONSTRAINT "CandidateAssessmentAttempt_candidateAssessmentId_fkey"
FOREIGN KEY ("candidateAssessmentId") REFERENCES "CandidateAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CandidateAssessmentAttempt"
ADD CONSTRAINT "CandidateAssessmentAttempt_attemptId_fkey"
FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CandidateAssessmentAttempt" ("id", "candidateAssessmentId", "attemptId", "linkedAt")
SELECT 'caa_' || "id" || '_' || "attemptId", "id", "attemptId", "createdAt"
FROM "CandidateAssessment"
WHERE "attemptId" IS NOT NULL
ON CONFLICT ("attemptId") DO NOTHING;
