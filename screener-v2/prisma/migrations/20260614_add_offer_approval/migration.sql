-- Add new statuses to CandidateOfferStatus enum
ALTER TYPE "CandidateOfferStatus" ADD VALUE IF NOT EXISTS 'submitted_for_approval';
ALTER TYPE "CandidateOfferStatus" ADD VALUE IF NOT EXISTS 'approved';

-- Create OfferApprovalChain table
CREATE TABLE "OfferApprovalChain" (
  "id"           TEXT NOT NULL,
  "departmentId" TEXT,
  "jobPostingId" TEXT,
  "name"         TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OfferApprovalChain_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfferApprovalChain_departmentId_idx" ON "OfferApprovalChain"("departmentId");
CREATE INDEX "OfferApprovalChain_jobPostingId_idx" ON "OfferApprovalChain"("jobPostingId");

ALTER TABLE "OfferApprovalChain" ADD CONSTRAINT "OfferApprovalChain_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferApprovalChain" ADD CONSTRAINT "OfferApprovalChain_jobPostingId_fkey"
  FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create OfferApprovalChainStep table
CREATE TABLE "OfferApprovalChainStep" (
  "id"         TEXT NOT NULL,
  "chainId"    TEXT NOT NULL,
  "approverId" TEXT NOT NULL,
  "sortOrder"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfferApprovalChainStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfferApprovalChainStep_chainId_sortOrder_idx" ON "OfferApprovalChainStep"("chainId", "sortOrder");

ALTER TABLE "OfferApprovalChainStep" ADD CONSTRAINT "OfferApprovalChainStep_chainId_fkey"
  FOREIGN KEY ("chainId") REFERENCES "OfferApprovalChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferApprovalChainStep" ADD CONSTRAINT "OfferApprovalChainStep_approverId_fkey"
  FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create OfferApprovalStep table (per-offer approval records)
CREATE TABLE "OfferApprovalStep" (
  "id"         TEXT NOT NULL,
  "offerId"    TEXT NOT NULL,
  "approverId" TEXT NOT NULL,
  "sortOrder"  INTEGER NOT NULL DEFAULT 0,
  "status"     TEXT NOT NULL DEFAULT 'pending',
  "note"       TEXT,
  "decidedAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfferApprovalStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfferApprovalStep_offerId_sortOrder_idx" ON "OfferApprovalStep"("offerId", "sortOrder");
CREATE INDEX "OfferApprovalStep_approverId_status_idx" ON "OfferApprovalStep"("approverId", "status");

ALTER TABLE "OfferApprovalStep" ADD CONSTRAINT "OfferApprovalStep_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "CandidateOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferApprovalStep" ADD CONSTRAINT "OfferApprovalStep_approverId_fkey"
  FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
