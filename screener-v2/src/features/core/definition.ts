import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { configV2, resolveCoreBasisRoleId, resolveCoreRoleLabel, roleOptions, stackOptions } from "@/lib/exams/definition-support";
import { buildCoreQuestions } from "@/features/core/questions";

export const coreAddonDefinition = {
  id: "core_exam",
  legacySectionId: "core",
  label: "Core",
  description: "Foundational multiple-choice exam driven by role and selected stacks.",
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
      description: "Choose the role level this core exam should target.",
      type: "single_select",
      required: true,
      options: roleOptions
    },
    {
      key: "stacks",
      label: "Tech stack",
      description: "Select one or more stacks that should be covered in the core exam.",
      type: "multi_select",
      required: true,
      options: stackOptions
    }
  ],
  defaultWeight: 50,
  defaultConfig: {
    roleId: configV2.defaultRoleId,
    roleLabel: configV2.roles[configV2.defaultRoleId ?? "Associate"]?.label ?? "Associate",
    coreBasisRoleId: configV2.defaultRoleId,
    stacks: [configV2.stacks[0]]
  },
  libraryEntries: [
    {
      seedKey: "addon-core-default",
      slug: "core-screening",
      label: "Core Screening",
      description: "Foundational multiple-choice screening focused on role coverage and selected stacks.",
      defaultConfig: {
        roleId: "Associate",
        roleLabel: "Associate",
        coreBasisRoleId: "Associate",
        stacks: ["UiPath"]
      },
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 60,
      defaultWeight: 50,
      isActive: true,
      sortOrder: 0
    }
  ],
  buildDurationMinutes: (config) => {
    const roleId = resolveCoreBasisRoleId(config);
    return Number(configV2.roles[roleId]?.time_limit_minutes ?? 20);
  },
  buildConfigSummary: (config) => {
    const stacks = Array.isArray(config.stacks) ? config.stacks.map(String) : [];
    return [resolveCoreRoleLabel(config), stacks.join(", ")].filter(Boolean).join(" | ");
  },
  buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent,
  resolveItems: buildCoreQuestions
} satisfies AddonDefinitionRegistration;
