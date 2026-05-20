-- CreateTable InterviewPanel
CREATE TABLE "InterviewPanel" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "roundNumber" INTEGER NOT NULL,
    "roundName" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'in_person',
    "scheduledAt" TIMESTAMP(3),
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable InterviewPanelMember
CREATE TABLE "InterviewPanelMember" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'interviewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewPanelMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable InterviewFeedback
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "overallRating" INTEGER,
    "recommendation" TEXT,
    "competencyJson" JSONB,
    "strengths" TEXT,
    "concerns" TEXT,
    "privateNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewPanel_candidateId_roundNumber_idx" ON "InterviewPanel"("candidateId", "roundNumber");

-- CreateIndex
CREATE INDEX "InterviewPanel_status_scheduledAt_idx" ON "InterviewPanel"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPanel_milestoneId_key" ON "InterviewPanel"("milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPanelMember_panelId_userId_key" ON "InterviewPanelMember"("panelId", "userId");

-- CreateIndex
CREATE INDEX "InterviewPanelMember_panelId_idx" ON "InterviewPanelMember"("panelId");

-- CreateIndex
CREATE INDEX "InterviewPanelMember_userId_idx" ON "InterviewPanelMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewFeedback_panelId_interviewerId_key" ON "InterviewFeedback"("panelId", "interviewerId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_panelId_idx" ON "InterviewFeedback"("panelId");

-- AddForeignKey
ALTER TABLE "InterviewPanel" ADD CONSTRAINT "InterviewPanel_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPanel" ADD CONSTRAINT "InterviewPanel_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "CandidateMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPanelMember" ADD CONSTRAINT "InterviewPanelMember_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "InterviewPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPanelMember" ADD CONSTRAINT "InterviewPanelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "InterviewPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
