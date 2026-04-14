import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { rpaRuntimeLevelOptions } from "@/lib/exams/definition-support";
import { buildRpaRuntimeQuestions, normalizeRpaRuntimeLevel } from "@/features/rpa-runtime/questions";

export const rpaRuntimeAddonDefinition = {
  id: "rpa_runtime_exam",
  label: "RPA Runtime Screener",
  description: "Runtime-heavy RPA screener focused on production judgment, Selenium, and Python automation.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(18,179,168,0.95),rgba(93,223,205,0.9))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [
    {
      key: "level",
      label: "Level",
      description: "Choose whether the runtime screener should use the Senior or Lead paper.",
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
      seedKey: "addon-rpa-runtime-senior-default",
      slug: "rpa-runtime-senior",
      label: "RPA Runtime Senior",
      description:
        "24-question runtime screener focused on production judgment, Selenium, and Python automation for senior engineers.",
      defaultConfig: {
        level: "Senior"
      },
      defaultDurationMinutes: 36,
      defaultRequiredPercent: 65,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 7
    },
    {
      seedKey: "addon-rpa-runtime-lead-default",
      slug: "rpa-runtime-lead",
      label: "RPA Runtime Lead",
      description:
        "24-question runtime screener focused on recovery, supportability, release judgment, Selenium, and Python automation for leads.",
      defaultConfig: {
        level: "Lead"
      },
      defaultDurationMinutes: 40,
      defaultRequiredPercent: 70,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 8
    }
  ],
  buildDurationMinutes: (config) => (String(config.level || "Senior") === "Lead" ? 40 : 36),
  buildConfigSummary: (config) => `${String(config.level || "Senior")} | RPA runtime, Selenium, Python`,
  buildRequiredPercent: (config, fallbackPassPercent) =>
    Math.max(fallbackPassPercent, String(config.level || "Senior") === "Lead" ? 70 : 65),
  resolveItems: (config) => buildRpaRuntimeQuestions(normalizeRpaRuntimeLevel(config.level))
} satisfies AddonDefinitionRegistration;
