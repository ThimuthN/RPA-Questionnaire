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
      md5('addon-core-2-default'),
      'core-2-0',
      'Core 2.0',
      'Hard-mode core exam with deeper debugging, architecture, and reliability judgment.',
      'core_2_exam',
      '{"roleId":"SE","roleLabel":"Software Engineer (SE)","coreBasisRoleId":"SE","stacks":["UiPath"]}'::jsonb,
      30,
      72,
      50,
      true,
      4
    ),
    (
      md5('addon-ba-default'),
      'business-analysis-assessment',
      'Business Analysis Assessment',
      'Requirements, process, and decision-quality assessment for BA-style work.',
      'business_analysis_exam',
      '{}'::jsonb,
      30,
      68,
      30,
      true,
      5
    )
ON CONFLICT ("slug") DO NOTHING;
