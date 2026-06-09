-- CreateTable
CREATE TABLE "CandidateApplicationAddonResult" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "presetId" TEXT,
  "presetLabel" TEXT NOT NULL,
  "addonId" TEXT,
  "addonSlug" TEXT NOT NULL,
  "addonLabel" TEXT NOT NULL,
  "assessmentTypeId" TEXT NOT NULL,
  "requiredPercent" INTEGER NOT NULL,
  "weight" INTEGER NOT NULL,
  "isMandatory" BOOLEAN NOT NULL DEFAULT true,
  "inlineSupported" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL,
  "applicantPercent" DOUBLE PRECISION,
  "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pointsPossible" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CandidateApplicationAddonResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateApplicationResponse" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "addonResultId" TEXT NOT NULL,
  "questionKey" TEXT NOT NULL,
  "questionLabel" TEXT NOT NULL,
  "formatLabel" TEXT NOT NULL,
  "answerJson" JSONB NOT NULL,
  "answerText" TEXT,
  "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pointsPossible" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CandidateApplicationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateApplicationAddonResult_applicationId_sortOrder_idx"
ON "CandidateApplicationAddonResult"("applicationId", "sortOrder");

-- CreateIndex
CREATE INDEX "CandidateApplicationResponse_applicationId_sortOrder_idx"
ON "CandidateApplicationResponse"("applicationId", "sortOrder");

-- CreateIndex
CREATE INDEX "CandidateApplicationResponse_addonResultId_sortOrder_idx"
ON "CandidateApplicationResponse"("addonResultId", "sortOrder");

-- AddForeignKey
ALTER TABLE "CandidateApplicationAddonResult"
  ADD CONSTRAINT "CandidateApplicationAddonResult_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplicationResponse"
  ADD CONSTRAINT "CandidateApplicationResponse_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplicationResponse"
  ADD CONSTRAINT "CandidateApplicationResponse_addonResultId_fkey"
  FOREIGN KEY ("addonResultId") REFERENCES "CandidateApplicationAddonResult"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
