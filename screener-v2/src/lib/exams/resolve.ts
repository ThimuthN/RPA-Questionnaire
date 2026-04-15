import type {
  ExamBlueprint,
  ExamBlueprintDraftItem,
  FrozenExamInstance,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import {
  carriesRoleContext,
  resolveCoreBasisRoleId,
  defaultDraftForDefinition,
  definitionIdFromLegacySection,
  deriveExamSelectionMetadata,
  isPracticalExamDefinition
} from "@/lib/exams/catalog";
import { randomizeExamQuestion } from "@/lib/exams/question-randomization";
import type { SectionId } from "@/lib/sections/types";
import { resolveExamItems } from "@/lib/exams/server-registry";
import { cuidLike } from "@/lib/tokens/token-service";

function ensureStacks(value: unknown, fallback: StackId[] = ["UiPath"]): StackId[] {
  if (!Array.isArray(value)) return fallback;
  const stacks = value.map((item) => String(item) as StackId).filter(Boolean);
  return stacks.length > 0 ? stacks : fallback;
}

export function normalizeExamDrafts(args: {
  exams?: ExamBlueprintDraftItem[];
  roleId?: RoleId;
  stacks?: StackId[];
  sections?: SectionId[];
  passPercent: number;
}): ExamBlueprintDraftItem[] {
  if (Array.isArray(args.exams) && args.exams.length > 0) {
    return args.exams.map((exam) => ({
      definitionId: exam.definitionId,
      sourceAddonId: exam.sourceAddonId,
      sourcePresetId: exam.sourcePresetId,
      label: exam.label,
      description: exam.description,
      config: exam.config ?? {},
      durationMinutes: exam.durationMinutes,
      weight: exam.weight,
      weightMode: exam.weightMode,
      requiredPercent: exam.requiredPercent,
      requiredPercentMode: exam.requiredPercentMode
    }));
  }

  if (Array.isArray(args.sections) && args.sections.length > 0) {
    return args.sections.map((sectionId) => {
      const definitionId = definitionIdFromLegacySection(sectionId);
      const draft = defaultDraftForDefinition(definitionId);
      if (definitionId === "core_exam") {
        draft.config = {
          roleId: args.roleId ?? "Associate",
          roleLabel: args.roleId ?? "Associate",
          coreBasisRoleId: args.roleId ?? "Associate",
          stacks: args.stacks?.length ? args.stacks : ["UiPath"]
        };
      }
      if (definitionId === "practical_exam") {
        draft.config = {
          stack: args.stacks?.[0] ?? "UiPath"
        };
      }
      draft.requiredPercent = deriveExamSelectionMetadata(definitionId, draft.config, args.passPercent).requiredPercent;
      return draft;
    });
  }

  return [];
}

export function resolveExamBlueprint(args: {
  drafts: ExamBlueprintDraftItem[];
  passPercent: number;
}): ExamBlueprint {
  const exams: FrozenExamInstance[] = args.drafts.map((draft, index) => {
    const metadata = deriveExamSelectionMetadata(draft.definitionId, draft.config ?? {}, args.passPercent);
    const instanceId = cuidLike();
    const items = resolveExamItems(draft.definitionId, draft.config ?? {}).map((item, itemIndex) =>
      randomizeExamQuestion(item, `${instanceId}|${draft.definitionId}|${item.id}|${itemIndex}`)
    );

    return {
      instanceId,
      definitionId: draft.definitionId,
      legacySectionId: metadata.legacySectionId,
      label: draft.label?.trim() || metadata.label,
      order: index,
      config: draft.config ?? {},
      configSummary: metadata.configSummary,
      durationMinutes:
        typeof draft.durationMinutes === "number" && Number.isFinite(draft.durationMinutes)
          ? Math.max(1, Math.round(draft.durationMinutes))
          : metadata.durationMinutes,
      weight: typeof draft.weight === "number" ? draft.weight : 1,
      requiredPercent:
        typeof draft.requiredPercent === "number" ? draft.requiredPercent : metadata.requiredPercent,
      contentSnapshot: {
        title: draft.label?.trim() || metadata.label,
        description: draft.description?.trim() || metadata.configSummary,
        items
      }
    };
  });

  return {
    exams
  };
}

export function blueprintRoleId(blueprint: ExamBlueprint, fallback: RoleId = "Associate"): RoleId {
  const core = blueprint.exams.find((exam) => carriesRoleContext(exam.definitionId));
  return resolveCoreBasisRoleId(core?.config ?? {}, fallback);
}

export function blueprintStacks(blueprint: ExamBlueprint, fallback: StackId[] = ["UiPath"]): StackId[] {
  const core = blueprint.exams.find((exam) => carriesRoleContext(exam.definitionId));
  if (core) return ensureStacks(core.config?.stacks, fallback);
  const practical = blueprint.exams.find((exam) => isPracticalExamDefinition(exam.definitionId));
  if (practical) return [String(practical.config?.stack || fallback[0]) as StackId];
  return fallback;
}

export function blueprintLegacySections(blueprint: ExamBlueprint): SectionId[] {
  return blueprint.exams
    .map((exam) => exam.legacySectionId)
    .filter((sectionId): sectionId is SectionId => Boolean(sectionId));
}
