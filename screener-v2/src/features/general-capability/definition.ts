import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { generalCapabilityQuestions } from "@/features/general-capability/questions";

export const generalCapabilityAddonDefinition = {
  id: "general_capability_exam",
  label: "General Capability Assessment (GCA)",
  description: "Universal hiring screener focused on logic, judgment, prioritization, and communication.",
  accentTone: "amber",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]",
  panelClass:
    "border-amber-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-amber-bg)_92%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 30,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-gca-default",
      slug: "general-capability-assessment",
      label: "General Capability Assessment",
      description: "General capability assessment for judgment, prioritization, and communication.",
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 60,
      defaultWeight: 30,
      isActive: true,
      sortOrder: 3
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: () => "Universal hiring screener",
  buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent,
  resolveItems: () => generalCapabilityQuestions
} satisfies AddonDefinitionRegistration;
