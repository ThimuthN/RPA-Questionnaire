-- Create missing tables that were added via vibe-coding sessions but never migrated.
-- Targeted: only CREATE TABLE / index / FK for new tables. Existing-table ALTERs omitted.

CREATE TABLE IF NOT EXISTS "CandidateAttachment" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "label" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CandidateExternalAssessmentUploadToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "label" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateExternalAssessmentUploadToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiInteractionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'chat',
    "candidateId" TEXT,
    "promptChars" INTEGER NOT NULL DEFAULT 0,
    "responseChars" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiInteractionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "roleId" TEXT,
    "departmentId" TEXT,
    "managerId" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'full_time',
    "employmentStatus" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "probationEndDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmployeeActivityEvent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "event" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmployeeGoal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'performance',
    "status" TEXT NOT NULL DEFAULT 'active',
    "targetDate" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "EmployeeGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GoalCheckIn" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "progressSnapshot" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PerformanceReview" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'annual',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "overallRating" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "nextPeriodFocus" TEXT,
    "employeeAcknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "CandidateAttachment_candidateId_uploadedAt_idx" ON "CandidateAttachment"("candidateId", "uploadedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateAttachment_candidateId_storageKey_key" ON "CandidateAttachment"("candidateId", "storageKey");

CREATE UNIQUE INDEX IF NOT EXISTS "CandidateExternalAssessmentUploadToken_token_key" ON "CandidateExternalAssessmentUploadToken"("token");
CREATE INDEX IF NOT EXISTS "CandidateExternalAssessmentUploadToken_assessmentId_idx" ON "CandidateExternalAssessmentUploadToken"("assessmentId");
CREATE INDEX IF NOT EXISTS "CandidateExternalAssessmentUploadToken_token_idx" ON "CandidateExternalAssessmentUploadToken"("token");

CREATE UNIQUE INDEX IF NOT EXISTS "Employee_candidateId_key" ON "Employee"("candidateId");
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_employeeNumber_key" ON "Employee"("employeeNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email");
CREATE INDEX IF NOT EXISTS "Employee_departmentId_employmentStatus_idx" ON "Employee"("departmentId", "employmentStatus");
CREATE INDEX IF NOT EXISTS "Employee_managerId_idx" ON "Employee"("managerId");
CREATE INDEX IF NOT EXISTS "Employee_roleId_idx" ON "Employee"("roleId");
CREATE INDEX IF NOT EXISTS "Employee_employmentStatus_startDate_idx" ON "Employee"("employmentStatus", "startDate");

CREATE INDEX IF NOT EXISTS "EmployeeActivityEvent_employeeId_createdAt_idx" ON "EmployeeActivityEvent"("employeeId", "createdAt");
CREATE INDEX IF NOT EXISTS "EmployeeGoal_employeeId_status_idx" ON "EmployeeGoal"("employeeId", "status");
CREATE INDEX IF NOT EXISTS "EmployeeGoal_employeeId_targetDate_idx" ON "EmployeeGoal"("employeeId", "targetDate");
CREATE INDEX IF NOT EXISTS "GoalCheckIn_goalId_createdAt_idx" ON "GoalCheckIn"("goalId", "createdAt");
CREATE INDEX IF NOT EXISTS "PerformanceReview_employeeId_createdAt_idx" ON "PerformanceReview"("employeeId", "createdAt");
CREATE INDEX IF NOT EXISTS "PerformanceReview_reviewerId_status_idx" ON "PerformanceReview"("reviewerId", "status");
CREATE INDEX IF NOT EXISTS "AiInteractionLog_userId_createdAt_idx" ON "AiInteractionLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiInteractionLog_createdAt_idx" ON "AiInteractionLog"("createdAt");

-- Foreign keys for new tables only
ALTER TABLE "CandidateAttachment" ADD CONSTRAINT "CandidateAttachment_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CandidateExternalAssessmentUploadToken" ADD CONSTRAINT "CandidateExternalAssessmentUploadToken_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "CandidateExternalAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "RoleCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmployeeActivityEvent" ADD CONSTRAINT "EmployeeActivityEvent_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeGoal" ADD CONSTRAINT "EmployeeGoal_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalCheckIn" ADD CONSTRAINT "GoalCheckIn_goalId_fkey"
    FOREIGN KEY ("goalId") REFERENCES "EmployeeGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
