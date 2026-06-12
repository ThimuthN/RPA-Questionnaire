ALTER TABLE "CandidateApplication"
ADD COLUMN "screeningAttemptId" TEXT;

CREATE UNIQUE INDEX "CandidateApplication_screeningAttemptId_key"
ON "CandidateApplication"("screeningAttemptId");

CREATE INDEX "CandidateApplication_screeningAttemptId_idx"
ON "CandidateApplication"("screeningAttemptId");

ALTER TABLE "CandidateApplication"
ADD CONSTRAINT "CandidateApplication_screeningAttemptId_fkey"
FOREIGN KEY ("screeningAttemptId") REFERENCES "Attempt"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
