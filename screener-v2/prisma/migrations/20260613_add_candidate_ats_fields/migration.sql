-- Add ATS profile fields to Candidate
ALTER TABLE "Candidate" ADD COLUMN "linkedInUrl" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "location" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "currentTitle" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "salaryExpectation" TEXT;
