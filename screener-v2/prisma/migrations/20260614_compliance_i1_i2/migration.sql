-- I2: Consent fields on CandidateApplication
ALTER TABLE "CandidateApplication" ADD COLUMN IF NOT EXISTS "consentGivenAt" TIMESTAMP(3);
ALTER TABLE "CandidateApplication" ADD COLUMN IF NOT EXISTS "consentVersion" TEXT;

-- I1: DataRetentionPolicy
CREATE TABLE "DataRetentionPolicy" (
  "id"             TEXT NOT NULL,
  "departmentId"   TEXT,
  "retentionDays"  INTEGER NOT NULL,
  "actionOnExpiry" TEXT NOT NULL DEFAULT 'notify',
  "appliesTo"      TEXT NOT NULL DEFAULT 'rejected_candidates',
  "createdById"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataRetentionPolicy_departmentId_idx" ON "DataRetentionPolicy"("departmentId");

ALTER TABLE "DataRetentionPolicy" ADD CONSTRAINT "DataRetentionPolicy_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
