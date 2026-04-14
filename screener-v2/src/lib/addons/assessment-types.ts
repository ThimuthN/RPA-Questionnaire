import { z } from "zod";
import type {
  ExamConfigFieldDefinition,
  ExamConfigFieldDefinitionWithOptions,
  ExamDefinitionId
} from "@/lib/assessment-engine/types";
import {
  addonDefinitionIds,
  addonDefinitionRegistry,
  orderedAddonDefinitions
} from "@/lib/addons/definitions";

export interface AddonAssessmentType {
  id: ExamDefinitionId;
  label: string;
  description: string;
  tone: "blue" | "teal" | "purple" | "amber";
  configFields: ExamConfigFieldDefinition[];
  defaultConfig: Record<string, unknown>;
  defaultWeight: number;
  buildDurationMinutes: (config: Record<string, unknown>) => number;
  buildRequiredPercent: (config: Record<string, unknown>, fallbackPassPercent: number) => number;
}

export interface AddonAssessmentTypeMeta {
  label: string;
  tone: "blue" | "teal" | "purple" | "amber" | "red";
  configFields: ExamConfigFieldDefinition[];
  description?: string;
}

export interface AddonAssessmentTypeConfigPreparation {
  config: Record<string, unknown>;
  messages: string[];
}

export const addonAssessmentTypeIds = addonDefinitionIds;

export const addonAssessmentTypeIdSchema = z.enum(addonAssessmentTypeIds);

function createAddonAssessmentType(typeId: ExamDefinitionId): AddonAssessmentType {
  const entry = addonDefinitionRegistry[typeId];
  return {
    id: entry.id,
    label: entry.label,
    description: entry.description,
    tone: entry.accentTone,
    configFields: entry.configFields,
    defaultConfig: entry.defaultConfig,
    defaultWeight: entry.defaultWeight,
    buildDurationMinutes: entry.buildDurationMinutes,
    buildRequiredPercent: entry.buildRequiredPercent
  };
}

export const addonAssessmentTypeCatalog: Record<(typeof addonAssessmentTypeIds)[number], AddonAssessmentType> =
  Object.fromEntries(
    addonAssessmentTypeIds.map((typeId) => [typeId, createAddonAssessmentType(typeId)])
  ) as Record<(typeof addonAssessmentTypeIds)[number], AddonAssessmentType>;

export const orderedAddonAssessmentTypes: AddonAssessmentType[] = orderedAddonDefinitions.map((definition) =>
  createAddonAssessmentType(definition.id)
);

export function getAddonAssessmentType(typeId: string): AddonAssessmentType | null {
  if (!addonAssessmentTypeIds.includes(typeId as (typeof addonAssessmentTypeIds)[number])) {
    return null;
  }
  return addonAssessmentTypeCatalog[typeId as (typeof addonAssessmentTypeIds)[number]];
}

export function getAddonAssessmentTypeMeta(typeId: string): AddonAssessmentTypeMeta {
  const entry = getAddonAssessmentType(typeId);
  if (entry) {
    return {
      label: entry.label,
      tone: entry.tone,
      configFields: entry.configFields,
      description: entry.description
    };
  }

  return {
    label: "Unknown type",
    tone: "red",
    configFields: []
  };
}

function isKnownSingleSelectOption(field: ExamConfigFieldDefinitionWithOptions, value: unknown) {
  return typeof value === "string" && field.options.some((option) => option.value === value);
}

function normalizeMultiSelectValue(field: ExamConfigFieldDefinitionWithOptions, value: unknown) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(field.options.map((option) => option.value));
  return value
    .map((item) => String(item))
    .filter((item, index, array) => allowed.has(item) && array.indexOf(item) === index);
}

function normalizeBooleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return null;
}

function normalizeNumberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function prepareAddonConfigForFields(
  label: string,
  fields: ExamConfigFieldDefinition[],
  defaultConfig: Record<string, unknown>,
  rawConfig: Record<string, unknown>
) {
  const nextConfig: Record<string, unknown> = {
    ...structuredClone(defaultConfig),
    ...rawConfig
  };
  const messages: string[] = [];

  for (const field of fields) {
    const providedValue = nextConfig[field.key];
    if (field.type === "single_select") {
      if (providedValue == null || providedValue === "") {
        if (field.required && !isKnownSingleSelectOption(field, defaultConfig[field.key])) {
          messages.push(`${label} requires ${field.label.toLowerCase()}.`);
        }
        continue;
      }

      if (!isKnownSingleSelectOption(field, providedValue)) {
        messages.push(`${label} has an invalid ${field.label.toLowerCase()} selection.`);
      }
      continue;
    }

    if (field.type === "multi_select") {
      const normalized = normalizeMultiSelectValue(field, providedValue);
      nextConfig[field.key] = normalized;
      if (field.required && normalized.length === 0) {
        messages.push(`${label} requires at least one ${field.label.toLowerCase()} selection.`);
      }
      continue;
    }

    if (field.type === "text") {
      const normalized = typeof providedValue === "string" ? providedValue.trim() : "";
      nextConfig[field.key] = normalized;
      if (field.required && normalized.length === 0) {
        messages.push(`${label} requires ${field.label.toLowerCase()}.`);
      }
      continue;
    }

    if (field.type === "number") {
      if (providedValue == null || providedValue === "") {
        if (field.required && typeof defaultConfig[field.key] !== "number") {
          messages.push(`${label} requires ${field.label.toLowerCase()}.`);
        }
        continue;
      }

      const normalized = normalizeNumberValue(providedValue);
      if (normalized == null) {
        messages.push(`${label} has an invalid ${field.label.toLowerCase()} value.`);
        continue;
      }
      if (typeof field.min === "number" && normalized < field.min) {
        messages.push(`${label} ${field.label.toLowerCase()} must be at least ${field.min}.`);
      }
      if (typeof field.max === "number" && normalized > field.max) {
        messages.push(`${label} ${field.label.toLowerCase()} must be at most ${field.max}.`);
      }
      nextConfig[field.key] = normalized;
      continue;
    }

    const normalized = normalizeBooleanValue(providedValue);
    if (normalized == null) {
      if (field.required) {
        messages.push(`${label} requires ${field.label.toLowerCase()} to be set.`);
      }
      continue;
    }
    nextConfig[field.key] = normalized;
  }

  return { config: nextConfig, messages };
}

export function prepareAddonAssessmentTypeConfig(
  typeId: string,
  rawConfig: Record<string, unknown> | undefined
): AddonAssessmentTypeConfigPreparation {
  const entry = getAddonAssessmentType(typeId);
  if (!entry) {
    return {
      config: rawConfig ? { ...rawConfig } : {},
      messages: [`Unknown assessment type: ${typeId}`]
    };
  }

  const inputConfig = rawConfig ?? {};
  return prepareAddonConfigForFields(entry.label, entry.configFields, entry.defaultConfig, inputConfig);
}

export function assertAddonAssessmentTypeConfig(
  typeId: string,
  rawConfig: Record<string, unknown> | undefined
) {
  const result = prepareAddonAssessmentTypeConfig(typeId, rawConfig);
  if (result.messages.length > 0) {
    throw new Error(result.messages.join(" "));
  }
  return result.config;
}
