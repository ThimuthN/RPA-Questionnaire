-- CreateEnum
CREATE TYPE "HiringAssignmentRole" AS ENUM ('recruiter', 'hiring_manager', 'interviewer', 'reviewer', 'coordinator', 'approver');

-- CreateTable
CREATE TABLE "HiringAssignment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentRole" "HiringAssignmentRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiringAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HiringAssignment_applicationId_userId_assignmentRole_active_key" ON "HiringAssignment"("applicationId", "userId", "assignmentRole", "active");

-- CreateIndex
CREATE INDEX "HiringAssignment_applicationId_active_idx" ON "HiringAssignment"("applicationId", "active");

-- CreateIndex
CREATE INDEX "HiringAssignment_applicationId_assignmentRole_active_idx" ON "HiringAssignment"("applicationId", "assignmentRole", "active");

-- CreateIndex
CREATE INDEX "HiringAssignment_userId_active_idx" ON "HiringAssignment"("userId", "active");

-- CreateIndex
CREATE INDEX "HiringAssignment_active_idx" ON "HiringAssignment"("active");

-- AddForeignKey
ALTER TABLE "HiringAssignment" ADD CONSTRAINT "HiringAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringAssignment" ADD CONSTRAINT "HiringAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringAssignment" ADD CONSTRAINT "HiringAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
