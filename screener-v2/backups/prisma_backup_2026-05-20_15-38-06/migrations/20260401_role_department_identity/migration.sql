DROP INDEX IF EXISTS "RoleCatalog_label_key";

CREATE INDEX IF NOT EXISTS "RoleCatalog_label_department_idx" ON "RoleCatalog"("label", "department");
