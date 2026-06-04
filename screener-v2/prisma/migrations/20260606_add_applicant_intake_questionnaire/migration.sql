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
      md5('addon-applicant-intake-questionnaire-default'),
      'applicant-intake-questionnaire',
      'Applicant Intake Questionnaire',
      'Reusable applicant intake questionnaire for eligibility, shift comfort, compensation expectations, location, and work arrangement preferences.',
      'applicant_intake_questionnaire',
      '{}'::jsonb,
      5,
      100,
      1,
      true,
      13
    )
ON CONFLICT ("slug") DO NOTHING;
