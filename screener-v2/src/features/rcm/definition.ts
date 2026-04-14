import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { revenueCycleManagementQuestions } from "@/features/rcm/questions";

export const rcmAddonDefinition = {
  id: "rcm_exam",
  label: "RCM Assessment",
  description: "Advanced revenue cycle management exam focused on denials, remits, controls, and recovery judgment.",
  accentTone: "amber",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]",
  panelClass:
    "border-amber-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-amber-bg)_92%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 30,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-rcm-default",
      slug: "rcm-assessment",
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 75,
      defaultWeight: 30,
      isActive: true,
      sortOrder: 6
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: () => "Revenue cycle management assessment",
  buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 75),
  resolveItems: () => revenueCycleManagementQuestions
} satisfies AddonDefinitionRegistration;
