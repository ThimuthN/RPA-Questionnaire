-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN "screenerPresetId" TEXT;

-- CreateIndex
CREATE INDEX "JobPosting_screenerPresetId_idx" ON "JobPosting"("screenerPresetId");

-- AddForeignKey
ALTER TABLE "JobPosting"
  ADD CONSTRAINT "JobPosting_screenerPresetId_fkey"
  FOREIGN KEY ("screenerPresetId") REFERENCES "AssessmentPreset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
