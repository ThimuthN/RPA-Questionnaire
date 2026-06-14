ALTER TABLE "CandidateApplication" ADD COLUMN "source" TEXT;
ALTER TABLE "CandidateApplication" ADD COLUMN "referredBy" TEXT;

CREATE INDEX "CandidateApplication_source_idx" ON "CandidateApplication"("source");
