import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { businessAnalysisQuestions } from "@/features/business-analysis/questions";

export const businessAnalysisAddonDefinition = {
  id: "business_analysis_exam",
  label: "Business Analysis Assessment",
  description: "Requirements, process, and decision-quality assessment for BA-style work.",
  accentTone: "amber",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]",
  panelClass:
    "border-amber-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-amber-bg)_92%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 30,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-ba-default",
      slug: "business-analysis-assessment",
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 68,
      defaultWeight: 30,
      isActive: true,
      sortOrder: 5
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: () => "Business analysis assessment",
  buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 68),
  resolveItems: () => businessAnalysisQuestions
} satisfies AddonDefinitionRegistration;
