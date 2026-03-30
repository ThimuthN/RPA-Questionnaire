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

export function resolveCoreBasisRoleId(config: Record<string, unknown>, fallback: RoleId = configV2.defaultRoleId ?? "Associate"): RoleId {
  return String(config.coreBasisRoleId || config.roleId || fallback) as RoleId;
}

export function resolveCoreRoleLabel(config: Record<string, unknown>) {
  const basisRoleId = resolveCoreBasisRoleId(config);
  return String(config.roleLabel || configV2.roles[basisRoleId]?.label || basisRoleId);
}

export interface ExamDefinitionCatalogEntry {
  id: ExamDefinitionId;
  legacySectionId?: SectionId;
  label: string;
  description: string;
  accentTone: "blue" | "teal" | "purple" | "amber";
  scoreBarClass: string;
  panelClass: string;
  scoreSummaryBucket?: "core" | "practical";
  carriesRoleContext?: boolean;
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

export const coreBasisRoleOptions = [...roleOptions];

const advancedCoreRoleOptions = roleOptions.filter((option) =>
  ["SE", "SeniorSE", "TechLead"].includes(option.value)
);

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
    scoreBarClass: "bg-[linear-gradient(90deg,rgba(47,134,255,0.95),rgba(93,167,255,0.92))]",
    panelClass: "border-brand-300/20 bg-[linear-gradient(180deg,rgba(31,111,255,0.12),rgba(7,12,24,0.54))]",
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
    buildDurationMinutes: (config) => {
      const roleId = resolveCoreBasisRoleId(config);
      return Number(configV2.roles[roleId]?.time_limit_minutes ?? 20);
    },
    buildConfigSummary: (config) => {
      const stacks = Array.isArray(config.stacks) ? config.stacks.map(String) : [];
      return [resolveCoreRoleLabel(config), stacks.join(", ")].filter(Boolean).join(" | ");
    },
    buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent
  },
  core_2_exam: {
    id: "core_2_exam",
    label: "Core 2.0",
    description: "Hard-mode core exam focused on deeper debugging, architecture, and reliability judgment.",
    accentTone: "blue",
    scoreBarClass: "bg-[linear-gradient(90deg,rgba(47,134,255,0.95),rgba(93,167,255,0.92))]",
    panelClass: "border-brand-300/20 bg-[linear-gradient(180deg,rgba(31,111,255,0.12),rgba(7,12,24,0.54))]",
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
    buildDurationMinutes: () => 30,
    buildConfigSummary: (config) => {
      const stacks = Array.isArray(config.stacks) ? config.stacks.map(String) : [];
      return [resolveCoreRoleLabel(config), stacks.join(", ")].filter(Boolean).join(" | ");
    },
    buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 72)
  },
  practical_exam: {
    id: "practical_exam",
    legacySectionId: "practical",
    label: "Practical",
    description: "Hands-on scenario exam tuned to a single primary stack.",
    accentTone: "teal",
    scoreBarClass: "bg-[linear-gradient(90deg,rgba(18,179,168,0.95),rgba(93,223,205,0.9))]",
    panelClass: "border-teal-400/20 bg-[linear-gradient(180deg,rgba(18,179,168,0.12),rgba(7,12,24,0.54))]",
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
    scoreBarClass: "bg-[linear-gradient(90deg,rgba(148,93,255,0.95),rgba(188,148,255,0.88))]",
    panelClass: "border-purple-400/20 bg-[linear-gradient(180deg,rgba(148,93,255,0.12),rgba(7,12,24,0.54))]",
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
    scoreBarClass: "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]",
    panelClass: "border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(7,12,24,0.54))]",
    configFields: [],
    defaultWeight: 30,
    defaultConfig: {},
    buildDurationMinutes: () => 30,
    buildConfigSummary: () => "Universal hiring screener",
    buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent
  },
  business_analysis_exam: {
    id: "business_analysis_exam",
    label: "Business Analysis Assessment",
    description: "Requirements, process, and decision-quality assessment for BA-style work.",
    accentTone: "amber",
    scoreBarClass: "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]",
    panelClass: "border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(7,12,24,0.54))]",
    configFields: [],
    defaultWeight: 30,
    defaultConfig: {},
    buildDurationMinutes: () => 30,
    buildConfigSummary: () => "Business analysis assessment",
    buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 68)
  },
  rcm_exam: {
    id: "rcm_exam",
    label: "RCM Assessment",
    description: "Advanced revenue cycle management exam focused on denials, remits, controls, and recovery judgment.",
    accentTone: "amber",
    scoreBarClass: "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]",
    panelClass: "border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(7,12,24,0.54))]",
    configFields: [],
    defaultWeight: 30,
    defaultConfig: {},
    buildDurationMinutes: () => 30,
    buildConfigSummary: () => "Revenue cycle management assessment",
    buildRequiredPercent: (_config, fallbackPassPercent) => Math.max(fallbackPassPercent, 75)
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

export function isCoreExamDefinition(definitionId: ExamDefinitionId) {
  return examCatalog[definitionId].scoreSummaryBucket === "core";
}

export function isPracticalExamDefinition(definitionId: ExamDefinitionId) {
  return examCatalog[definitionId].scoreSummaryBucket === "practical";
}

export function carriesRoleContext(definitionId: ExamDefinitionId) {
  return examCatalog[definitionId].carriesRoleContext === true;
}

export function examPanelClass(definitionId: ExamDefinitionId) {
  return examCatalog[definitionId].panelClass;
}

export function examScoreBarClass(definitionId: ExamDefinitionId) {
  return examCatalog[definitionId].scoreBarClass;
}
