-- CreateTable
CREATE TABLE "CandidateMilestone" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "notes" TEXT,
    "score" DOUBLE PRECISION,
    "recommendation" TEXT,
    "candidateAssessmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateMilestone_candidateAssessmentId_key" ON "CandidateMilestone"("candidateAssessmentId");

-- CreateIndex
CREATE INDEX "CandidateMilestone_candidateId_sortOrder_idx" ON "CandidateMilestone"("candidateId", "sortOrder");

-- AddForeignKey
ALTER TABLE "CandidateMilestone" ADD CONSTRAINT "CandidateMilestone_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateMilestone" ADD CONSTRAINT "CandidateMilestone_candidateAssessmentId_fkey" FOREIGN KEY ("candidateAssessmentId") REFERENCES "CandidateAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill default milestones for existing candidates
INSERT INTO "CandidateMilestone" (
    "id",
    "candidateId",
    "type",
    "title",
    "status",
    "sortOrder",
    "mode",
    "createdAt",
    "updatedAt"
)
SELECT lower(md5(c."id" || ':registration:' || random()::text || clock_timestamp()::text)),
       c."id",
       'registration',
       'Registered',
       'done',
       10,
       'manual',
       c."createdAt",
       c."updatedAt"
FROM "Candidate" c;

INSERT INTO "CandidateMilestone" (
    "id",
    "candidateId",
    "type",
    "title",
    "status",
    "sortOrder",
    "mode",
    "createdAt",
    "updatedAt"
)
SELECT lower(md5(c."id" || ':screener:' || random()::text || clock_timestamp()::text)),
       c."id",
       'screener',
       'Screener',
       'not_started',
       20,
       'platform',
       c."createdAt",
       c."updatedAt"
FROM "Candidate" c;

INSERT INTO "CandidateMilestone" (
    "id",
    "candidateId",
    "type",
    "title",
    "status",
    "sortOrder",
    "mode",
    "createdAt",
    "updatedAt"
)
SELECT lower(md5(c."id" || ':interview:' || random()::text || clock_timestamp()::text)),
       c."id",
       'interview',
       'Interview',
       'not_started',
       30,
       'manual',
       c."createdAt",
       c."updatedAt"
FROM "Candidate" c;

INSERT INTO "CandidateMilestone" (
    "id",
    "candidateId",
    "type",
    "title",
    "status",
    "sortOrder",
    "mode",
    "createdAt",
    "updatedAt"
)
SELECT lower(md5(c."id" || ':advanced_test:' || random()::text || clock_timestamp()::text)),
       c."id",
       'advanced_test',
       'Advanced test',
       'not_started',
       40,
       'platform',
       c."createdAt",
       c."updatedAt"
FROM "Candidate" c;

INSERT INTO "CandidateMilestone" (
    "id",
    "candidateId",
    "type",
    "title",
    "status",
    "sortOrder",
    "mode",
    "createdAt",
    "updatedAt"
)
SELECT lower(md5(c."id" || ':decision:' || random()::text || clock_timestamp()::text)),
       c."id",
       'decision',
       'Offer / decision',
       'not_started',
       50,
       'manual',
       c."createdAt",
       c."updatedAt"
FROM "Candidate" c;
