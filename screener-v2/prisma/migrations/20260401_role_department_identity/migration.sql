ALTER TABLE "RoleCatalog" DROP CONSTRAINT "RoleCatalog_label_key";

CREATE INDEX "RoleCatalog_label_department_idx" ON "RoleCatalog"("label", "department");
