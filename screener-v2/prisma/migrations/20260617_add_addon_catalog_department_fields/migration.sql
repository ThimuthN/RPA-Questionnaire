ALTER TABLE "AddonCatalog" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "AddonCatalog" ADD COLUMN IF NOT EXISTS "sharedDepartmentIds" JSONB;

CREATE INDEX IF NOT EXISTS "AddonCatalog_departmentId_idx" ON "AddonCatalog"("departmentId");
