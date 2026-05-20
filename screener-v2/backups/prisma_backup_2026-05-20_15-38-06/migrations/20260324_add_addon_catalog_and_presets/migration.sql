CREATE TABLE "AddonCatalog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "engineType" TEXT NOT NULL,
    "defaultConfigJson" JSONB NOT NULL,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "defaultRequiredPercent" INTEGER NOT NULL,
    "defaultWeight" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AddonCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentPreset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentPreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentPresetItem" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "configOverrideJson" JSONB,
    "weightOverride" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentPresetItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AddonCatalog_slug_key" ON "AddonCatalog"("slug");
CREATE INDEX "AddonCatalog_isActive_sortOrder_idx" ON "AddonCatalog"("isActive", "sortOrder");
CREATE UNIQUE INDEX "AssessmentPreset_slug_key" ON "AssessmentPreset"("slug");
CREATE INDEX "AssessmentPreset_isActive_sortOrder_idx" ON "AssessmentPreset"("isActive", "sortOrder");
CREATE INDEX "AssessmentPresetItem_presetId_sortOrder_idx" ON "AssessmentPresetItem"("presetId", "sortOrder");
CREATE INDEX "AssessmentPresetItem_addonId_idx" ON "AssessmentPresetItem"("addonId");

ALTER TABLE "AssessmentPresetItem"
ADD CONSTRAINT "AssessmentPresetItem_presetId_fkey"
FOREIGN KEY ("presetId") REFERENCES "AssessmentPreset"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentPresetItem"
ADD CONSTRAINT "AssessmentPresetItem_addonId_fkey"
FOREIGN KEY ("addonId") REFERENCES "AddonCatalog"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AddonCatalog" (
    "id",
    "slug",
    "label",
    "description",
    "engineType",
    "defaultConfigJson",
    "defaultDurationMinutes",
    "defaultRequiredPercent",
    "defaultWeight",
    "isActive",
    "sortOrder"
)
VALUES
    (
      md5('addon-core-default'),
      'core-screening',
      'Core Screening',
      'Foundational multiple-choice screening focused on role coverage and selected stacks.',
      'core_exam',
      '{"roleId":"Associate","roleLabel":"Associate","coreBasisRoleId":"Associate","stacks":["UiPath"]}'::jsonb,
      30,
      60,
      50,
      true,
      0
    ),
    (
      md5('addon-practical-default'),
      'practical-automation',
      'Practical Automation',
      'Hands-on practical scenario built around a primary automation stack.',
      'practical_exam',
      '{"stack":"UiPath"}'::jsonb,
      10,
      60,
      30,
      true,
      1
    ),
    (
      md5('addon-logic-default'),
      'applied-logic-and-reasoning',
      'Applied Logic & Reasoning',
      'Short logic and reasoning assessment for problem solving and structured thinking.',
      'applied_logic_exam',
      '{}'::jsonb,
      10,
      60,
      20,
      true,
      2
    ),
    (
      md5('addon-gca-default'),
      'general-capability-assessment',
      'General Capability Assessment',
      'General capability assessment for judgment, prioritization, and communication.',
      'general_capability_exam',
      '{}'::jsonb,
      30,
      60,
      30,
      true,
      3
    )
ON CONFLICT ("slug") DO NOTHING;
