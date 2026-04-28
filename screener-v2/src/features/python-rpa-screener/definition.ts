import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { rpaRuntimeLevelOptions } from "@/lib/exams/definition-support";
import {
  buildPythonRpaScreenerQuestions,
  normalizePythonRpaScreenerLevel
} from "@/features/python-rpa-screener/questions";

export const pythonRpaScreenerAddonDefinition = {
  id: "python_rpa_screener_exam",
  label: "Python RPA Lead/Senior Screener",
  description:
    "Senior/Lead Python RPA screener focused on replay safety, Selenium diagnosis, testing, and operational judgment.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(20,184,166,0.95),rgba(45,212,191,0.88))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [
    {
      key: "level",
      label: "Level",
      description: "Choose whether the screener should use the Senior or Lead paper.",
      type: "single_select",
      required: true,
      options: [...rpaRuntimeLevelOptions]
    }
  ],
  defaultWeight: 100,
  defaultConfig: {
    level: "Senior"
  },
  libraryEntries: [
    {
      seedKey: "addon-python-rpa-screener-senior",
      slug: "python-rpa-senior-screener",
      label: "Python RPA Senior Screener",
      description:
        "21-question Senior Python RPA screener covering replay safety, Selenium diagnosis, testing, and operational judgment.",
      defaultConfig: {
        level: "Senior"
      },
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 65,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 8
    },
    {
      seedKey: "addon-python-rpa-screener-lead",
      slug: "python-rpa-lead-screener",
      label: "Python RPA Lead Screener",
      description:
        "31-question Lead Python RPA screener with governance, replay control, Selenium diagnostics, and production-risk judgment.",
      defaultConfig: {
        level: "Lead"
      },
      defaultDurationMinutes: 40,
      defaultRequiredPercent: 70,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 9
    }
  ],
  buildDurationMinutes: (config) => (String(config.level || "Senior") === "Lead" ? 40 : 30),
  buildConfigSummary: (config) => `${String(config.level || "Senior")} Python RPA Screener | Safety, Selenium`,
  buildRequiredPercent: (config, fallbackPassPercent) =>
    Math.max(fallbackPassPercent, String(config.level || "Senior") === "Lead" ? 70 : 65),
  resolveItems: (config) =>
    buildPythonRpaScreenerQuestions(normalizePythonRpaScreenerLevel(config.level))
} satisfies AddonDefinitionRegistration;

