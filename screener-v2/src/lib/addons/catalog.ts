import type { Prisma } from "@prisma/client";
import type { RoleId } from "@/lib/assessment-engine/types";
import type { ExamBlueprintDraftItem, ExamDefinitionId } from "@/lib/assessment-engine/types";
import {
  assertAddonAssessmentTypeConfig,
  prepareAddonAssessmentTypeConfig
} from "@/lib/addons/assessment-types";
import { prisma } from "@/lib/db/prisma";

export interface AddonCatalogEntry {
  id: string;
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

export interface AssessmentPresetItemEntry {
  id: string;
  addonId: string;
  sortOrder: number;
  configOverride: Record<string, unknown>;
  weightOverride?: number;
  addon: AddonCatalogEntry;
}

export interface AssessmentPresetEntry {
  id: string;
  slug: string;
  label: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  items: AssessmentPresetItemEntry[];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asInputJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

function mapAddon(row: {
  id: string;
  slug: string;
  label: string;
  description: string;
  assessmentTypeId: string;
  defaultConfigJson: unknown;
  defaultDurationMinutes: number;
  defaultRequiredPercent: number;
  defaultWeight: number;
  isActive: boolean;
  sortOrder: number;
}): AddonCatalogEntry {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    assessmentTypeId: row.assessmentTypeId as ExamDefinitionId,
    defaultConfig: asRecord(row.defaultConfigJson),
    defaultDurationMinutes: row.defaultDurationMinutes,
    defaultRequiredPercent: row.defaultRequiredPercent,
    defaultWeight: row.defaultWeight,
    isActive: row.isActive,
    sortOrder: row.sortOrder
  };
}

function mapPreset(row: {
  id: string;
  slug: string;
  label: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  items: Array<{
    id: string;
    addonId: string;
    sortOrder: number;
    configOverrideJson: unknown;
    weightOverride: number | null;
    addon: {
      id: string;
      slug: string;
      label: string;
      description: string;
      assessmentTypeId: string;
      defaultConfigJson: unknown;
      defaultDurationMinutes: number;
      defaultRequiredPercent: number;
      defaultWeight: number;
      isActive: boolean;
      sortOrder: number;
    };
  }>;
}): AssessmentPresetEntry {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    items: row.items.map((item) => ({
      id: item.id,
      addonId: item.addonId,
      sortOrder: item.sortOrder,
      configOverride: asRecord(item.configOverrideJson),
      weightOverride: typeof item.weightOverride === "number" ? item.weightOverride : undefined,
      addon: mapAddon(item.addon)
    }))
  };
}

async function nextAddonSortOrder() {
  const last = await prisma.addonCatalog.findFirst({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: { sortOrder: true }
  });

  return (last?.sortOrder ?? -1) + 1;
}

async function nextPresetSortOrder() {
  const last = await prisma.assessmentPreset.findFirst({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: { sortOrder: true }
  });

  return (last?.sortOrder ?? -1) + 1;
}

async function loadAddonConfigMap(addonIds: string[]) {
  const uniqueAddonIds = Array.from(new Set(addonIds));
  const rows = await prisma.addonCatalog.findMany({
    where: { id: { in: uniqueAddonIds } }
  });
  const addons = rows.map(mapAddon);
  return new Map(addons.map((addon) => [addon.id, addon]));
}

function normalizeConfigOverride(
  addon: AddonCatalogEntry,
  configOverride?: Record<string, unknown>
) {
  const rawOverride = configOverride ?? {};
  const prepared = assertAddonAssessmentTypeConfig(addon.assessmentTypeId, {
    ...addon.defaultConfig,
    ...rawOverride
  });
  return Object.fromEntries(Object.keys(rawOverride).map((key) => [key, prepared[key]]));
}

export async function listAddonCatalog(includeInactive = false): Promise<AddonCatalogEntry[]> {
  const rows = await prisma.addonCatalog.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
  });

  return rows.map(mapAddon);
}

export async function getAddonCatalogEntry(id: string) {
  const row = await prisma.addonCatalog.findUnique({
    where: { id }
  });

  return row ? mapAddon(row) : null;
}

export async function createAddonCatalogEntry(input: {
  label: string;
  description: string;
  assessmentTypeId: ExamDefinitionId;
  defaultConfig?: Record<string, unknown>;
  defaultDurationMinutes: number;
  defaultRequiredPercent: number;
  defaultWeight: number;
  isActive?: boolean;
}) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Add-on label is required.");
  }

  const slug = slugify(label);
  const existing = await prisma.addonCatalog.findFirst({
    where: {
      OR: [{ slug }, { label }]
    }
  });
  if (existing) {
    throw new Error("An add-on with this name already exists.");
  }

  const defaultConfig = assertAddonAssessmentTypeConfig(input.assessmentTypeId, input.defaultConfig);

  const created = await prisma.addonCatalog.create({
    data: {
      slug,
      label,
      description: input.description.trim(),
      assessmentTypeId: input.assessmentTypeId,
      defaultConfigJson: asInputJson(defaultConfig),
      defaultDurationMinutes: Math.max(1, Math.round(input.defaultDurationMinutes)),
      defaultRequiredPercent: Math.min(100, Math.max(0, Math.round(input.defaultRequiredPercent))),
      defaultWeight: Math.max(0, Math.round(input.defaultWeight)),
      isActive: input.isActive ?? true,
      sortOrder: await nextAddonSortOrder()
    }
  });

  return mapAddon(created);
}

export async function updateAddonCatalogEntry(
  id: string,
  input: {
    label: string;
    description: string;
    assessmentTypeId: ExamDefinitionId;
    defaultConfig?: Record<string, unknown>;
    defaultDurationMinutes: number;
    defaultRequiredPercent: number;
    defaultWeight: number;
    isActive?: boolean;
  }
) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Add-on label is required.");
  }

  const slug = slugify(label);
  const existing = await prisma.addonCatalog.findFirst({
    where: {
      OR: [{ slug }, { label }],
      NOT: { id }
    },
    select: { id: true }
  });
  if (existing) {
    throw new Error("An add-on with this name already exists.");
  }

  const defaultConfig = assertAddonAssessmentTypeConfig(input.assessmentTypeId, input.defaultConfig);

  const updated = await prisma.addonCatalog.update({
    where: { id },
    data: {
      slug,
      label,
      description: input.description.trim(),
      assessmentTypeId: input.assessmentTypeId,
      defaultConfigJson: asInputJson(defaultConfig),
      defaultDurationMinutes: Math.max(1, Math.round(input.defaultDurationMinutes)),
      defaultRequiredPercent: Math.min(100, Math.max(0, Math.round(input.defaultRequiredPercent))),
      defaultWeight: Math.max(0, Math.round(input.defaultWeight)),
      isActive: input.isActive ?? true
    }
  });

  return mapAddon(updated);
}

export async function listAssessmentPresets(includeInactive = false): Promise<AssessmentPresetEntry[]> {
  const rows = await prisma.assessmentPreset.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: {
      items: {
        include: {
          addon: true
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
  });

  return rows.map(mapPreset);
}

export async function createAssessmentPreset(input: {
  label: string;
  description: string;
  isActive?: boolean;
  items: Array<{
    addonId: string;
    sortOrder: number;
    configOverride?: Record<string, unknown>;
    weightOverride?: number;
  }>;
}) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Preset label is required.");
  }
  if (input.items.length === 0) {
    throw new Error("Select at least one add-on for the preset.");
  }

  const slug = slugify(label);
  const existing = await prisma.assessmentPreset.findFirst({
    where: {
      OR: [{ slug }, { label }]
    },
    select: { id: true }
  });
  if (existing) {
    throw new Error("A preset with this name already exists.");
  }

  const addonConfigMap = await loadAddonConfigMap(input.items.map((item) => item.addonId));
  const normalizedItems = input.items.map((item) => {
    const addon = addonConfigMap.get(item.addonId);
    if (!addon) {
      throw new Error("One or more selected add-ons could not be found.");
    }

    return {
      ...item,
      configOverride: normalizeConfigOverride(addon, item.configOverride)
    };
  });

  const created = await prisma.$transaction(async (tx) => {
    const preset = await tx.assessmentPreset.create({
      data: {
        slug,
        label,
        description: input.description.trim(),
        isActive: input.isActive ?? true,
        sortOrder: await nextPresetSortOrder()
      }
    });

    await tx.assessmentPresetItem.createMany({
      data: normalizedItems.map((item, index) => ({
        presetId: preset.id,
        addonId: item.addonId,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
        configOverrideJson: asInputJson(item.configOverride),
        weightOverride:
          typeof item.weightOverride === "number" ? Math.max(0, Math.round(item.weightOverride)) : null
      }))
    });

    return tx.assessmentPreset.findUniqueOrThrow({
      where: { id: preset.id },
      include: {
        items: {
          include: {
            addon: true
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      }
    });
  });

  return mapPreset(created);
}

export async function updateAssessmentPreset(
  id: string,
  input: {
    label: string;
    description: string;
    isActive?: boolean;
    items: Array<{
      addonId: string;
      sortOrder: number;
      configOverride?: Record<string, unknown>;
      weightOverride?: number;
    }>;
  }
) {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Preset label is required.");
  }
  if (input.items.length === 0) {
    throw new Error("Select at least one add-on for the preset.");
  }

  const slug = slugify(label);
  const existing = await prisma.assessmentPreset.findFirst({
    where: {
      OR: [{ slug }, { label }],
      NOT: { id }
    },
    select: { id: true }
  });
  if (existing) {
    throw new Error("A preset with this name already exists.");
  }

  const addonConfigMap = await loadAddonConfigMap(input.items.map((item) => item.addonId));
  const normalizedItems = input.items.map((item) => {
    const addon = addonConfigMap.get(item.addonId);
    if (!addon) {
      throw new Error("One or more selected add-ons could not be found.");
    }

    return {
      ...item,
      configOverride: normalizeConfigOverride(addon, item.configOverride)
    };
  });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.assessmentPreset.update({
      where: { id },
      data: {
        slug,
        label,
        description: input.description.trim(),
        isActive: input.isActive ?? true
      }
    });

    await tx.assessmentPresetItem.deleteMany({
      where: { presetId: id }
    });

    await tx.assessmentPresetItem.createMany({
      data: normalizedItems.map((item, index) => ({
        presetId: id,
        addonId: item.addonId,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
        configOverrideJson: asInputJson(item.configOverride),
        weightOverride:
          typeof item.weightOverride === "number" ? Math.max(0, Math.round(item.weightOverride)) : null
      }))
    });

    return tx.assessmentPreset.findUniqueOrThrow({
      where: { id },
      include: {
        items: {
          include: {
            addon: true
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      }
    });
  });

  return mapPreset(updated);
}

export function buildDraftFromAddon(
  addon: AddonCatalogEntry,
  options?: {
    configOverride?: Record<string, unknown>;
    weightOverride?: number;
    sourcePresetId?: string;
  }
): ExamBlueprintDraftItem {
  const weightOverride = options?.weightOverride;
  const preparedConfig = prepareAddonAssessmentTypeConfig(addon.assessmentTypeId, {
    ...addon.defaultConfig,
    ...(options?.configOverride ?? {})
  });

  return {
    definitionId: addon.assessmentTypeId,
    sourceAddonId: addon.id,
    sourcePresetId: options?.sourcePresetId,
    label: addon.label,
    description: addon.description,
    config: preparedConfig.config,
    durationMinutes: addon.defaultDurationMinutes,
    requiredPercent: addon.defaultRequiredPercent,
    requiredPercentMode: "manual",
    weight: typeof weightOverride === "number" ? weightOverride : addon.defaultWeight,
    weightMode: typeof weightOverride === "number" ? "manual" : "auto"
  };
}

export function buildDraftsFromPreset(preset: AssessmentPresetEntry): ExamBlueprintDraftItem[] {
  return preset.items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) =>
      buildDraftFromAddon(item.addon, {
        configOverride: item.configOverride,
        weightOverride: item.weightOverride,
        sourcePresetId: preset.id
      })
    );
}

export function defaultCoreConfigForRole(roleId: RoleId = "Associate") {
  return {
    roleId,
    roleLabel: roleId,
    coreBasisRoleId: roleId,
    stacks: ["UiPath"]
  };
}
