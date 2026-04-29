import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { buildSeniorPythonExamQuestions } from "@/features/python-senior-exam/questions";

export const pythonSeniorExamAddonDefinition = {
  id: "python_senior_exam",
  label: "Senior Python Exam",
  description:
    "21-question comprehensive Python automation exam covering replay safety, Selenium diagnostics, code review, and operational judgment for Senior-level roles.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(20,184,166,0.95),rgba(45,212,191,0.88))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 100,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-python-senior-exam-default",
      slug: "python-senior-exam",
      label: "Senior Python Exam",
      description: "21-question Senior Python automation exam covering replay safety, code review, and operational judgment.",
      defaultConfig: {},
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 65,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 10
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: () => "Senior Python Exam | Safety, Selenium, Code Review",
  buildRequiredPercent: (_, fallbackPassPercent) => Math.max(fallbackPassPercent, 65),
  resolveItems: () => buildSeniorPythonExamQuestions()
} satisfies AddonDefinitionRegistration;
