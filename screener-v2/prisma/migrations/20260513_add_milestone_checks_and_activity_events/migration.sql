-- CreateTable CandidateMilestoneCheck
CREATE TABLE "CandidateMilestoneCheck" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateMilestoneCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable CandidateActivityEvent
CREATE TABLE "CandidateActivityEvent" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "event" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateActivityEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidateMilestoneCheck" ADD CONSTRAINT "CandidateMilestoneCheck_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "CandidateMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateActivityEvent" ADD CONSTRAINT "CandidateActivityEvent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "CandidateMilestoneCheck_milestoneId_type_key" ON "CandidateMilestoneCheck"("milestoneId", "type");

-- CreateIndex
CREATE INDEX "CandidateMilestoneCheck_milestoneId_idx" ON "CandidateMilestoneCheck"("milestoneId");

-- CreateIndex
CREATE INDEX "CandidateActivityEvent_candidateId_createdAt_idx" ON "CandidateActivityEvent"("candidateId", "createdAt");
