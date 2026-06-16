-- Create the CandidateOfferStatus enum (was mistakenly left as TEXT)
CREATE TYPE "CandidateOfferStatus" AS ENUM (
  'draft',
  'submitted_for_approval',
  'approved',
  'sent',
  'accepted',
  'rejected',
  'expired'
);

-- Drop default, convert column, restore default as enum
ALTER TABLE "CandidateOffer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CandidateOffer"
  ALTER COLUMN "status" TYPE "CandidateOfferStatus"
  USING "status"::"CandidateOfferStatus";
ALTER TABLE "CandidateOffer" ALTER COLUMN "status" SET DEFAULT 'draft'::"CandidateOfferStatus";
