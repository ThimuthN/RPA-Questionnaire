CREATE TABLE "RoleCatalog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "coreBasisRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoleCatalog_slug_key" ON "RoleCatalog"("slug");
CREATE UNIQUE INDEX "RoleCatalog_label_key" ON "RoleCatalog"("label");
CREATE INDEX "RoleCatalog_isActive_sortOrder_idx" ON "RoleCatalog"("isActive", "sortOrder");

ALTER TABLE "Candidate" ADD COLUMN "roleId" TEXT;
CREATE INDEX "Candidate_roleId_idx" ON "Candidate"("roleId");

ALTER TABLE "Attempt" ALTER COLUMN "roleId" DROP NOT NULL;

ALTER TABLE "Candidate"
ADD CONSTRAINT "Candidate_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "RoleCatalog"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "RoleCatalog" ("id", "slug", "label", "sortOrder", "isActive", "coreBasisRoleId")
VALUES
    (md5('intern-role-seed'), 'intern', 'Intern', 0, true, 'Intern'),
    (md5('associate-role-seed'), 'associate', 'Associate', 1, true, 'Associate'),
    (md5('se-role-seed'), 'se', 'Software Engineer (SE)', 2, true, 'SE'),
    (md5('senior-se-role-seed'), 'senior-se', 'Senior Software Engineer', 3, true, 'SeniorSE'),
    (md5('tech-lead-role-seed'), 'tech-lead', 'Tech Lead', 4, true, 'TechLead')
ON CONFLICT ("slug") DO NOTHING;

UPDATE "Candidate" AS c
SET "roleId" = r."id"
FROM "RoleCatalog" AS r
WHERE c."roleId" IS NULL
  AND c."positionAppliedFor" IS NOT NULL
  AND (
    lower(c."positionAppliedFor") = lower(r."label")
    OR regexp_replace(lower(c."positionAppliedFor"), '[^a-z0-9]+', '-', 'g') = r."slug"
  );
