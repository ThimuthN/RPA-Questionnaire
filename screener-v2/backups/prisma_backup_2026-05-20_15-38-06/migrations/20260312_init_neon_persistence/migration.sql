-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "blueprintJson" JSONB NOT NULL,
    "questionBankRef" TEXT NOT NULL,
    "practicalPackRef" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "assessmentVersionId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "passcodeHash" TEXT,
    "roleLocked" BOOLEAN NOT NULL DEFAULT true,
    "stackLocked" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT,
    "stacksJson" JSONB,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "usedAttempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "assessmentVersionId" TEXT NOT NULL,
    "inviteId" TEXT,
    "participantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "stacksJson" JSONB NOT NULL,
    "seed" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "coreQuestionIdsJson" JSONB NOT NULL,
    "coreAnswersJson" JSONB NOT NULL,
    "practicalAnswerJson" JSONB NOT NULL,
    "practicalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "practicalPossible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingCoreSeconds" INTEGER NOT NULL,
    "remainingPracticalSeconds" INTEGER NOT NULL,
    "integrityJson" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "corePercent" DOUBLE PRECISION NOT NULL,
    "practicalPercent" DOUBLE PRECISION NOT NULL,
    "finalPercent" DOUBLE PRECISION NOT NULL,
    "pass" BOOLEAN NOT NULL,
    "borderline" BOOLEAN NOT NULL,
    "breakdownJson" JSONB NOT NULL,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_slug_key" ON "Invite"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX "Invite_assessmentVersionId_idx" ON "Invite"("assessmentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_kind_email_key" ON "Participant"("kind", "email");

-- CreateIndex
CREATE INDEX "Attempt_inviteId_idx" ON "Attempt"("inviteId");

-- CreateIndex
CREATE INDEX "Attempt_participantId_idx" ON "Attempt"("participantId");

-- CreateIndex
CREATE INDEX "Attempt_status_startedAt_idx" ON "Attempt"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Result_attemptId_key" ON "Result"("attemptId");

-- CreateIndex
CREATE INDEX "Result_finalPercent_idx" ON "Result"("finalPercent");

-- CreateIndex
CREATE UNIQUE INDEX "MagicToken_tokenHash_key" ON "MagicToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicToken_email_idx" ON "MagicToken"("email");

