-- CreateTable CandidateOffer
CREATE TABLE "CandidateOffer" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "compensationType" TEXT NOT NULL DEFAULT 'salary',
    "compensationAmount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "targetStartDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "offerNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateOffer_candidateId_key" ON "CandidateOffer"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateOffer_status_updatedAt_idx" ON "CandidateOffer"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "CandidateOffer_candidateId_idx" ON "CandidateOffer"("candidateId");

-- AddForeignKey
ALTER TABLE "CandidateOffer" ADD CONSTRAINT "CandidateOffer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
