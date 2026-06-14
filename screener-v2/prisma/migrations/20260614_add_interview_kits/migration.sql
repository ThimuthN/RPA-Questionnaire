-- CreateTable: InterviewKit
CREATE TABLE "InterviewKit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InterviewKitCompetency
CREATE TABLE "InterviewKitCompetency" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "anchors" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewKitCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JobPostingInterviewKit
CREATE TABLE "JobPostingInterviewKit" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "milestoneType" TEXT NOT NULL DEFAULT 'interview',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobPostingInterviewKit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewKit_departmentId_idx" ON "InterviewKit"("departmentId");
CREATE INDEX "InterviewKit_isGlobal_idx" ON "InterviewKit"("isGlobal");
CREATE INDEX "InterviewKitCompetency_kitId_sortOrder_idx" ON "InterviewKitCompetency"("kitId", "sortOrder");
CREATE UNIQUE INDEX "JobPostingInterviewKit_jobPostingId_kitId_milestoneType_key" ON "JobPostingInterviewKit"("jobPostingId", "kitId", "milestoneType");
CREATE INDEX "JobPostingInterviewKit_jobPostingId_idx" ON "JobPostingInterviewKit"("jobPostingId");
CREATE INDEX "JobPostingInterviewKit_kitId_idx" ON "JobPostingInterviewKit"("kitId");

-- AddForeignKey
ALTER TABLE "InterviewKit" ADD CONSTRAINT "InterviewKit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterviewKit" ADD CONSTRAINT "InterviewKit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterviewKitCompetency" ADD CONSTRAINT "InterviewKitCompetency_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "InterviewKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobPostingInterviewKit" ADD CONSTRAINT "JobPostingInterviewKit_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobPostingInterviewKit" ADD CONSTRAINT "JobPostingInterviewKit_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "InterviewKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
