import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { buildSePythonExamQuestions } from "@/features/se-python-exam/questions";

export const sePythonExamAddonDefinition = {
  id: "se_python_exam",
  label: "SE Python Exam",
  description:
    "15-question SE Python automation exam covering Selenium, API automation, data extraction, Python code quality, and error handling.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(20,184,166,0.95),rgba(45,212,191,0.88))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 100,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-se-python-exam-default",
      slug: "se-python-exam",
      label: "SE Python Exam",
      description:
        "15-question SE Python automation exam covering Selenium, API automation, scraping, Python code quality, and error handling.",
      defaultConfig: {},
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 60,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 9
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: () => "SE Python Exam | Selenium, APIs, Code Quality",
  buildRequiredPercent: (_, fallbackPassPercent) => Math.max(fallbackPassPercent, 60),
  resolveItems: () => buildSePythonExamQuestions()
} satisfies AddonDefinitionRegistration;
