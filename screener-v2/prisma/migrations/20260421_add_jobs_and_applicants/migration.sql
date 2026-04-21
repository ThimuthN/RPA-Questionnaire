-- AlterTable
ALTER TABLE "Candidate"
ADD COLUMN "intakeBucket" TEXT NOT NULL DEFAULT 'pipeline';

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleId" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateApplication" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_slug_key" ON "JobPosting"("slug");

-- CreateIndex
CREATE INDEX "JobPosting_roleId_idx" ON "JobPosting"("roleId");

-- CreateIndex
CREATE INDEX "JobPosting_isPublished_isOpen_updatedAt_idx" ON "JobPosting"("isPublished", "isOpen", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateApplication_candidateId_jobPostingId_key" ON "CandidateApplication"("candidateId", "jobPostingId");

-- CreateIndex
CREATE INDEX "CandidateApplication_candidateId_createdAt_idx" ON "CandidateApplication"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "CandidateApplication_jobPostingId_status_createdAt_idx" ON "CandidateApplication"("jobPostingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Candidate_intakeBucket_updatedAt_idx" ON "Candidate"("intakeBucket", "updatedAt");

-- AddForeignKey
ALTER TABLE "JobPosting"
ADD CONSTRAINT "JobPosting_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication"
ADD CONSTRAINT "CandidateApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication"
ADD CONSTRAINT "CandidateApplication_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
