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
      md5('addon-rcm-default'),
      'rcm-assessment',
      'RCM Assessment',
      'Advanced revenue cycle management exam focused on denials, remits, controls, and recovery judgment.',
      'rcm_exam',
      '{}'::jsonb,
      30,
      75,
      30,
      true,
      6
    )
ON CONFLICT ("slug") DO NOTHING;
