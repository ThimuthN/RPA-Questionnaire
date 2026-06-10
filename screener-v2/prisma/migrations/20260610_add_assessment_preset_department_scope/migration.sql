ALTER TABLE "AssessmentPreset"
ADD COLUMN "departmentId" TEXT;

CREATE INDEX "AssessmentPreset_departmentId_isActive_sortOrder_idx"
ON "AssessmentPreset"("departmentId", "isActive", "sortOrder");

ALTER TABLE "AssessmentPreset"
ADD CONSTRAINT "AssessmentPreset_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
