import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { buildLeadPythonExamQuestions } from "@/features/python-lead-exam/questions";

export const pythonLeadExamAddonDefinition = {
  id: "python_lead_exam",
  label: "Python Lead Exam",
  description:
    "31-question comprehensive Python automation exam covering governance, replay controls, Selenium diagnostics, and production-risk judgment for Lead-level roles.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(20,184,166,0.95),rgba(45,212,191,0.88))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 100,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-python-lead-exam-default",
      slug: "python-lead-exam",
      label: "Python Lead Exam",
      description: "31-question Lead Python automation exam covering governance, replay control, and production-risk judgment.",
      defaultConfig: {},
      defaultDurationMinutes: 40,
      defaultRequiredPercent: 70,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 11
    }
  ],
  buildDurationMinutes: () => 40,
  buildConfigSummary: () => "Python Lead Exam | Governance, Control, Risk",
  buildRequiredPercent: (_, fallbackPassPercent) => Math.max(fallbackPassPercent, 70),
  resolveItems: () => buildLeadPythonExamQuestions()
} satisfies AddonDefinitionRegistration;
