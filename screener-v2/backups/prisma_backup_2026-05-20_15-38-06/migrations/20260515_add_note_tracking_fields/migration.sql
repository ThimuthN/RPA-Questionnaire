-- Add tracking fields to CandidateNote for editing and soft delete
ALTER TABLE "CandidateNote" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CandidateNote" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "CandidateNote" ADD COLUMN "updatedById" TEXT;
