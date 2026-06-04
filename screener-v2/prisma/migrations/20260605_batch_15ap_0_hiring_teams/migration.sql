-- CreateEnum for HiringTeamRole
CREATE TYPE "HiringTeamRole" AS ENUM ('owner', 'recruiter', 'hiring_manager', 'interviewer', 'reviewer', 'final_approver');

-- CreateEnum for DepartmentCandidacyTeamAssignmentSource
CREATE TYPE "DepartmentCandidacyTeamAssignmentSource" AS ENUM ('template', 'job_default', 'manual');

-- Add hiringTeamTemplates relation to Department
-- (Department already has id, so no change needed there)

-- CreateTable HiringTeamTemplate
CREATE TABLE "HiringTeamTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HiringTeamTemplate_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE
);

-- CreateTable HiringTeamTemplateMember
CREATE TABLE "HiringTeamTemplateMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HiringTeamRole" NOT NULL,
    CONSTRAINT "HiringTeamTemplateMember_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "HiringTeamTemplate" ("id") ON DELETE CASCADE,
    CONSTRAINT "HiringTeamTemplateMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable DepartmentCandidacyTeamAssignment
CREATE TABLE "DepartmentCandidacyTeamAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidacyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HiringTeamRole" NOT NULL,
    "source" "DepartmentCandidacyTeamAssignmentSource" NOT NULL DEFAULT 'manual',
    "templateId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addedById" TEXT,
    CONSTRAINT "DepartmentCandidacyTeamAssignment_candidacyId_fkey" FOREIGN KEY ("candidacyId") REFERENCES "DepartmentCandidacy" ("id") ON DELETE CASCADE,
    CONSTRAINT "DepartmentCandidacyTeamAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    CONSTRAINT "DepartmentCandidacyTeamAssignment_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE SET NULL
);

-- CreateIndex for HiringTeamTemplate
CREATE INDEX "HiringTeamTemplate_departmentId_isActive_sortOrder_idx" ON "HiringTeamTemplate"("departmentId", "isActive", "sortOrder");

-- CreateIndex for HiringTeamTemplateMember
CREATE UNIQUE INDEX "HiringTeamTemplateMember_templateId_userId_role_key" ON "HiringTeamTemplateMember"("templateId", "userId", "role");
CREATE INDEX "HiringTeamTemplateMember_templateId_idx" ON "HiringTeamTemplateMember"("templateId");
CREATE INDEX "HiringTeamTemplateMember_userId_idx" ON "HiringTeamTemplateMember"("userId");

-- CreateIndex for DepartmentCandidacyTeamAssignment
CREATE UNIQUE INDEX "DepartmentCandidacyTeamAssignment_candidacyId_userId_role_key" ON "DepartmentCandidacyTeamAssignment"("candidacyId", "userId", "role");
CREATE INDEX "DepartmentCandidacyTeamAssignment_candidacyId_idx" ON "DepartmentCandidacyTeamAssignment"("candidacyId");
CREATE INDEX "DepartmentCandidacyTeamAssignment_userId_idx" ON "DepartmentCandidacyTeamAssignment"("userId");
CREATE INDEX "DepartmentCandidacyTeamAssignment_isActive_idx" ON "DepartmentCandidacyTeamAssignment"("isActive");
