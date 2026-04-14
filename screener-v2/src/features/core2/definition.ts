import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import {
  advancedCoreRoleOptions,
  configV2,
  ensureStacks,
  resolveCoreRoleLabel,
  stackOptions
} from "@/lib/exams/definition-support";
import { buildCore2Questions } from "@/features/core2/questions";

export const core2AddonDefinition = {
  id: "core_2_exam",
  label: "Core 2.0",
  description: "Hard-mode core exam focused on deeper debugging, architecture, and reliability judgment.",
  accentTone: "blue",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(47,134,255,0.95),rgba(93,167,255,0.92))]",
  panelClass:
    "border-brand-300/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-brand)_10%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  scoreSummaryBucket: "core",
  carriesRoleContext: true,
  configFields: [
    {
      key: "roleId",
      label: "Role",
      description: "Choose the role level this advanced core exam should target.",
      type: "single_select",
      required: true,
      options: advancedCoreRoleOptions
    },
    {
      key: "stacks",
      label: "Tech stack",
      description: "Choose the primary automation stack context for the advanced core exam.",
      type: "multi_select",
      required: true,
      options: stackOptions
    }
  ],
  defaultWeight: 50,
  defaultConfig: {
    roleId: "SE",
    roleLabel: configV2.roles.SE?.label ?? "Software Engineer (SE)",
    coreBasisRoleId: "SE",
    stacks: [configV2.stacks[0]]
  },
  libraryEntries: [
    {
      seedKey: "addon-core-2-default",
      slug: "core-2-0",
      defaultConfig: {
        roleId: "SE",
        roleLabel: "Software Engineer (SE)",
        coreBasisRoleId: "SE",
        stacks: ["UiPath"]
      },
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 72,
      defaultWeight: 50,
      isActive: true,
      sortOrder: 4
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: (config) => {
    const stacks = Array.isArray(config.stacks) ? config.stacks.map(String) : [];
    return [resolveCoreRoleLabel(config), stacks.join(", ")].filter(Boolean).join(" | ");
  },
  buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 72),
  resolveItems: (config) => buildCore2Questions(ensureStacks(config.stacks))
} satisfies AddonDefinitionRegistration;
