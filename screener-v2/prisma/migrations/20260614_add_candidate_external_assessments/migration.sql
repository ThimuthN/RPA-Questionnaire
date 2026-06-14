CREATE TABLE "CandidateExternalAssessment" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceLabel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "scorePercent" DOUBLE PRECISION,
  "scoreLabel" TEXT,
  "summary" TEXT,
  "completedAt" TIMESTAMP(3),
  "recordedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateExternalAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateExternalAssessmentAttachment" (
  "id" TEXT NOT NULL,
  "externalAssessmentId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "storageUrl" TEXT NOT NULL,
  "uploadedById" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CandidateExternalAssessmentAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CandidateExternalAssessment_candidateId_createdAt_idx"
ON "CandidateExternalAssessment"("candidateId", "createdAt");

CREATE INDEX "CandidateExternalAssessment_candidateId_completedAt_idx"
ON "CandidateExternalAssessment"("candidateId", "completedAt");

CREATE UNIQUE INDEX "CandidateExternalAssessmentAttachment_externalAssessmentId_storageKey_key"
ON "CandidateExternalAssessmentAttachment"("externalAssessmentId", "storageKey");

CREATE INDEX "CandidateExternalAssessmentAttachment_externalAssessmentId_uploadedAt_idx"
ON "CandidateExternalAssessmentAttachment"("externalAssessmentId", "uploadedAt");

ALTER TABLE "CandidateExternalAssessment"
ADD CONSTRAINT "CandidateExternalAssessment_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CandidateExternalAssessmentAttachment"
ADD CONSTRAINT "CandidateExternalAssessmentAttachment_externalAssessmentId_fkey"
FOREIGN KEY ("externalAssessmentId") REFERENCES "CandidateExternalAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
