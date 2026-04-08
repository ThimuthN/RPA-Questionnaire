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
      md5('addon-rpa-runtime-senior-default'),
      'rpa-runtime-senior',
      'RPA Runtime Senior',
      '24-question runtime screener focused on production judgment, Selenium, and Python automation for senior engineers.',
      'rpa_runtime_exam',
      '{"level":"Senior"}'::jsonb,
      36,
      65,
      100,
      true,
      7
    ),
    (
      md5('addon-rpa-runtime-lead-default'),
      'rpa-runtime-lead',
      'RPA Runtime Lead',
      '24-question runtime screener focused on recovery, supportability, release judgment, Selenium, and Python automation for leads.',
      'rpa_runtime_exam',
      '{"level":"Lead"}'::jsonb,
      40,
      70,
      100,
      true,
      8
    )
ON CONFLICT ("slug") DO NOTHING;
