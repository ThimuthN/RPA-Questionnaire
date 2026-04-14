import type { StackId } from "@/lib/assessment-engine/types";
import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { configV2, stackOptions } from "@/lib/exams/definition-support";
import { buildPracticalQuestions } from "@/features/practical/questions";

export const practicalAddonDefinition = {
  id: "practical_exam",
  legacySectionId: "practical",
  label: "Practical",
  description: "Hands-on scenario exam tuned to a single primary stack.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(18,179,168,0.95),rgba(93,223,205,0.9))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  scoreSummaryBucket: "practical",
  configFields: [
    {
      key: "stack",
      label: "Tech stack",
      description: "Choose the stack used for the practical scenario.",
      type: "single_select",
      required: true,
      options: stackOptions
    }
  ],
  defaultWeight: 30,
  defaultConfig: {
    stack: configV2.stacks[0]
  },
  libraryEntries: [
    {
      seedKey: "addon-practical-default",
      slug: "practical-automation",
      label: "Practical Automation",
      description: "Hands-on practical scenario built around a primary automation stack.",
      defaultConfig: {
        stack: "UiPath"
      },
      defaultDurationMinutes: 10,
      defaultRequiredPercent: 60,
      defaultWeight: 30,
      isActive: true,
      sortOrder: 1
    }
  ],
  buildDurationMinutes: () => 10,
  buildConfigSummary: (config) => {
    const stack = String(config.stack || configV2.stacks[0]) as StackId;
    return configV2.stackLabels[stack] ?? stack;
  },
  buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 50),
  resolveItems: buildPracticalQuestions
} satisfies AddonDefinitionRegistration;
