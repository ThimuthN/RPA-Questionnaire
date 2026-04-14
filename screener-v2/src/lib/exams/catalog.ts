import type {
  ExamBlueprintDraftItem,
  ExamSummaryItem,
  FrozenExamInstance
} from "@/lib/assessment-engine/types";
import { addonDefinitionRegistry, orderedAddonDefinitions, type AddonDefinitionRegistration } from "@/lib/addons/definitions";
import type { ExamDefinitionId } from "@/lib/exams/definitions";
import {
  advancedCoreRoleOptions,
  configV2,
  coreBasisRoleOptions,
  ensureStacks,
  resolveCoreBasisRoleId,
  resolveCoreRoleLabel,
  roleOptions,
  rpaRuntimeLevelOptions,
  stackOptions
} from "@/lib/exams/definition-support";
import type { SectionId } from "@/lib/sections/types";

export {
  advancedCoreRoleOptions,
  configV2,
  coreBasisRoleOptions,
  ensureStacks,
  resolveCoreBasisRoleId,
  resolveCoreRoleLabel,
  roleOptions,
  rpaRuntimeLevelOptions,
  stackOptions
};

export type ExamDefinitionCatalogEntry = AddonDefinitionRegistration;

export const examCatalog: Record<ExamDefinitionId, ExamDefinitionCatalogEntry> = addonDefinitionRegistry;

export const orderedExamCatalog = [...orderedAddonDefinitions];

export function definitionIdFromLegacySection(sectionId: SectionId): ExamDefinitionId {
  const match = orderedAddonDefinitions.find(
    (definition) => "legacySectionId" in definition && definition.legacySectionId === sectionId
  );
  if (match) return match.id;
  return "applied_logic_exam";
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
