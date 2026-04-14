import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { buildLogicReasoningQuestions } from "@/features/logic-reasoning/questions";

export const appliedLogicAddonDefinition = {
  id: "applied_logic_exam",
  legacySectionId: "applied_logic_reasoning",
  label: "Applied Logic & Reasoning",
  description: "Short logic and reasoning exam with no extra configuration.",
  accentTone: "purple",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(148,93,255,0.95),rgba(188,148,255,0.88))]",
  panelClass:
    "border-purple-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-purple-bg)_92%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 20,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-logic-default",
      slug: "applied-logic-and-reasoning",
      defaultDurationMinutes: 10,
      defaultRequiredPercent: 60,
      defaultWeight: 20,
      isActive: true,
      sortOrder: 2
    }
  ],
  buildDurationMinutes: () => 10,
  buildConfigSummary: () => "Standard set",
  buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent,
  resolveItems: buildLogicReasoningQuestions
} satisfies AddonDefinitionRegistration;
