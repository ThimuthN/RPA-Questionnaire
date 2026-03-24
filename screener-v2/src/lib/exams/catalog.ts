import configRaw from "@/lib/data/config-v2.json";
import type {
  ConfigV2,
  ExamBlueprintDraftItem,
  ExamConfigFieldDefinition,
  ExamDefinitionId,
  ExamSummaryItem,
  FrozenExamInstance,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import type { SectionId } from "@/lib/sections/types";

const configV2 = configRaw as ConfigV2;

export interface ExamDefinitionCatalogEntry {
  id: ExamDefinitionId;
  legacySectionId?: SectionId;
  label: string;
  description: string;
  accentTone: "blue" | "teal" | "purple" | "amber";
  configFields: ExamConfigFieldDefinition[];
  defaultWeight: number;
  defaultConfig: Record<string, unknown>;
  buildDurationMinutes: (config: Record<string, unknown>) => number;
  buildConfigSummary: (config: Record<string, unknown>) => string;
  buildRequiredPercent: (config: Record<string, unknown>, fallbackPassPercent: number) => number;
}

const roleOptions = configV2.canonicalRoleOrder.map((roleId) => ({
  value: roleId,
  label: configV2.roles[roleId].label
}));

const stackOptions = configV2.stacks.map((stackId) => ({
  value: stackId,
  label: configV2.stackLabels[stackId]
}));

export const examCatalog: Record<ExamDefinitionId, ExamDefinitionCatalogEntry> = {
  core_exam: {
    id: "core_exam",
    legacySectionId: "core",
    label: "Core",
    description: "Foundational multiple-choice exam driven by role and selected stacks.",
    accentTone: "blue",
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
      stacks: [configV2.stacks[0]]
    },
    buildDurationMinutes: (config) => {
      const roleId = String(config.roleId || configV2.defaultRoleId) as RoleId;
      return Number(configV2.roles[roleId]?.time_limit_minutes ?? 20);
    },
    buildConfigSummary: (config) => {
      const roleId = String(config.roleId || configV2.defaultRoleId) as RoleId;
      const stacks = Array.isArray(config.stacks) ? config.stacks.map(String) : [];
      return [configV2.roles[roleId]?.label ?? roleId, stacks.join(", ")].filter(Boolean).join(" | ");
    },
    buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent
  },
  practical_exam: {
    id: "practical_exam",
    legacySectionId: "practical",
    label: "Practical",
    description: "Hands-on scenario exam tuned to a single primary stack.",
    accentTone: "teal",
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
    buildDurationMinutes: () => 10,
    buildConfigSummary: (config) => {
      const stack = String(config.stack || configV2.stacks[0]) as StackId;
      return configV2.stackLabels[stack] ?? stack;
    },
    buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 50)
  },
  applied_logic_exam: {
    id: "applied_logic_exam",
    legacySectionId: "applied_logic_reasoning",
    label: "Applied Logic & Reasoning",
    description: "Short logic and reasoning exam with no extra configuration.",
    accentTone: "purple",
    configFields: [],
    defaultWeight: 20,
    defaultConfig: {},
    buildDurationMinutes: () => 10,
    buildConfigSummary: () => "Standard set",
    buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent
  },
  general_capability_exam: {
    id: "general_capability_exam",
    label: "General Capability Assessment (GCA)",
    description: "Universal hiring screener focused on logic, judgment, prioritization, and communication.",
    accentTone: "amber",
    configFields: [],
    defaultWeight: 30,
    defaultConfig: {},
    buildDurationMinutes: () => 30,
    buildConfigSummary: () => "Universal hiring screener",
    buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent
  }
};

export const orderedExamCatalog = Object.values(examCatalog);

export function definitionIdFromLegacySection(sectionId: SectionId): ExamDefinitionId {
  switch (sectionId) {
    case "core":
      return "core_exam";
    case "practical":
      return "practical_exam";
    default:
      return "applied_logic_exam";
  }
}

export function defaultDraftForDefinition(definitionId: ExamDefinitionId): ExamBlueprintDraftItem {
  const entry = examCatalog[definitionId];
  return {
    definitionId,
    config: structuredClone(entry.defaultConfig),
    weight: entry.defaultWeight
  };
}

export function summarizeExamInstance(instance: FrozenExamInstance): ExamSummaryItem {
  return {
    instanceId: instance.instanceId,
    definitionId: instance.definitionId,
    legacySectionId: instance.legacySectionId,
    label: instance.label,
    configSummary: instance.configSummary,
    order: instance.order,
    durationMinutes: instance.durationMinutes,
    weight: instance.weight,
    requiredPercent: instance.requiredPercent
  };
}

export function deriveExamSelectionMetadata(
  definitionId: ExamDefinitionId,
  config: Record<string, unknown>,
  passPercent: number
) {
  const entry = examCatalog[definitionId];
  return {
    label: entry.label,
    legacySectionId: entry.legacySectionId,
    durationMinutes: entry.buildDurationMinutes(config),
    configSummary: entry.buildConfigSummary(config),
    requiredPercent: entry.buildRequiredPercent(config, passPercent)
  };
}
