import type { ExamDefinitionId } from "@/lib/assessment-engine/types";
import { assertAddonAssessmentTypeConfig } from "@/lib/addons/assessment-types";
import { orderedAddonDefinitions, type AddonDefinitionRegistration } from "@/lib/addons/definitions";

export interface AddonCatalogSeed {
  seedKey: string;
  slug: string;
  label: string;
  description: string;
  assessmentTypeId: ExamDefinitionId;
  defaultConfig: Record<string, unknown>;
  defaultDurationMinutes: number;
  defaultRequiredPercent: number;
  defaultWeight: number;
  isActive: boolean;
  sortOrder: number;
}

type AddonLibraryEntryRegistration = NonNullable<AddonDefinitionRegistration["libraryEntries"]>[number];

function deriveCatalogSeed(
  definition: AddonDefinitionRegistration,
  entry: AddonLibraryEntryRegistration
): AddonCatalogSeed {
  const defaultConfig = assertAddonAssessmentTypeConfig(
    definition.id,
    entry.defaultConfig ?? definition.defaultConfig
  );

  return {
    seedKey: entry.seedKey,
    slug: entry.slug,
    label: entry.label ?? definition.label,
    description: entry.description ?? definition.description,
    assessmentTypeId: definition.id,
    defaultConfig,
    defaultDurationMinutes:
      typeof entry.defaultDurationMinutes === "number"
        ? entry.defaultDurationMinutes
        : definition.buildDurationMinutes(defaultConfig),
    defaultRequiredPercent:
      typeof entry.defaultRequiredPercent === "number"
        ? entry.defaultRequiredPercent
        : definition.buildRequiredPercent(defaultConfig, 60),
    defaultWeight:
      typeof entry.defaultWeight === "number" ? entry.defaultWeight : definition.defaultWeight,
    isActive: entry.isActive ?? true,
    sortOrder: entry.sortOrder
  };
}

export const addonCatalogSeeds: AddonCatalogSeed[] = orderedAddonDefinitions.flatMap((definition) =>
  (definition.libraryEntries ?? []).map((entry) => deriveCatalogSeed(definition, entry))
);
