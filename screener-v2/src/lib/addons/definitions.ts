import type { ExamConfigFieldDefinition, ExamQuestion } from "@/lib/assessment-engine/types";
import type { SectionId } from "@/lib/sections/types";
import { businessAnalysisAddonDefinition } from "@/features/business-analysis/definition";
import { coreAddonDefinition } from "@/features/core/definition";
import { core2AddonDefinition } from "@/features/core2/definition";
import { generalCapabilityAddonDefinition } from "@/features/general-capability/definition";
import { appliedLogicAddonDefinition } from "@/features/logic-reasoning/definition";
import { practicalAddonDefinition } from "@/features/practical/definition";
import { pythonRpaScreenerAddonDefinition } from "@/features/python-rpa-screener/definition";
import { imageAnalysisAddonDefinition } from "@/features/image-analysis/definition";
import { rcmAddonDefinition } from "@/features/rcm/definition";
import { rpaRuntimeAddonDefinition } from "@/features/rpa-runtime/definition";

export interface AddonDefinitionRegistration {
  id: string;
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
  retiredLibrarySlugs?: string[];
  libraryEntries?: Array<{
    seedKey: string;
    slug: string;
    label?: string;
    description?: string;
    defaultConfig?: Record<string, unknown>;
    defaultDurationMinutes?: number;
    defaultRequiredPercent?: number;
    defaultWeight?: number;
    isActive?: boolean;
    sortOrder: number;
  }>;
  buildDurationMinutes: (config: Record<string, unknown>) => number;
  buildConfigSummary: (config: Record<string, unknown>) => string;
  buildRequiredPercent: (config: Record<string, unknown>, fallbackPassPercent: number) => number;
  resolveItems: (config: Record<string, unknown>) => ExamQuestion[];
}

export const orderedAddonDefinitions = [
  coreAddonDefinition,
  core2AddonDefinition,
  rpaRuntimeAddonDefinition,
  pythonRpaScreenerAddonDefinition,
  imageAnalysisAddonDefinition,
  practicalAddonDefinition,
  appliedLogicAddonDefinition,
  generalCapabilityAddonDefinition,
  businessAnalysisAddonDefinition,
  rcmAddonDefinition
] as const;

export type AddonDefinitionId = (typeof orderedAddonDefinitions)[number]["id"];

export const addonDefinitionIds = orderedAddonDefinitions.map((definition) => definition.id) as [
  AddonDefinitionId,
  ...AddonDefinitionId[]
];

export const addonDefinitionRegistry = Object.fromEntries(
  orderedAddonDefinitions.map((definition) => [definition.id, definition])
) as Record<AddonDefinitionId, (typeof orderedAddonDefinitions)[number]>;

export function getAddonDefinition(definitionId: string) {
  if (!addonDefinitionIds.includes(definitionId as AddonDefinitionId)) {
    return null;
  }
  return addonDefinitionRegistry[definitionId as AddonDefinitionId];
}
