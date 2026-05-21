import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { buildAssociateSePythonExamQuestions } from "@/features/associate-se-python-exam/questions";

export const associateSePythonExamAddonDefinition = {
  id: "associate_se_python_exam",
  label: "Associate SE Python Exam",
  description:
    "12-question Associate SE Python automation exam covering portal automation, extraction, error handling, workflow design, data handling, and scheduling.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(20,184,166,0.95),rgba(45,212,191,0.88))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 100,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-associate-se-python-exam-default",
      slug: "associate-se-python-exam",
      label: "Associate SE Python Exam",
      description:
        "12-question Associate SE Python automation exam covering portal automation, data extraction, error handling, workflow design, and scheduling.",
      defaultConfig: {},
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 60,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 8
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: () => "Associate SE Python Exam | Automation Fundamentals",
  buildRequiredPercent: (_, fallbackPassPercent) => Math.max(fallbackPassPercent, 60),
  resolveItems: () => buildAssociateSePythonExamQuestions()
} satisfies AddonDefinitionRegistration;
