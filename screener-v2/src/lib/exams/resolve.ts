import crypto from "node:crypto";
import type {
  ExamBlueprint,
  ExamBlueprintDraftItem,
  ExamQuestion,
  FrozenExamInstance,
  LogicReasoningQuestion,
  PracticalTaskQuestion,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import { buildSelection } from "@/lib/assessment-engine/selection";
import { getQuestionsByIds, questionBank } from "@/lib/data/question-bank";
import { generalCapabilityQuestions } from "@/features/general-capability/questions";
import {
  resolveCoreBasisRoleId,
  defaultDraftForDefinition,
  definitionIdFromLegacySection,
  deriveExamSelectionMetadata
} from "@/lib/exams/catalog";
import type { SectionId } from "@/lib/sections/types";
import { pickLogicReasoningPack } from "@/features/logic-reasoning/packs";
import { pickPracticalPack } from "@/features/practical/packs";

function cuidLike() {
  return crypto.randomUUID().replace(/-/g, "");
}

function ensureStacks(value: unknown, fallback: StackId[] = ["UiPath"]): StackId[] {
  if (!Array.isArray(value)) return fallback;
  const stacks = value.map((item) => String(item) as StackId).filter(Boolean);
  return stacks.length > 0 ? stacks : fallback;
}

function resolveCoreItems(config: Record<string, unknown>): { items: ExamQuestion[]; roleId: RoleId; stacks: StackId[] } {
  const roleId = resolveCoreBasisRoleId(config);
  const stacks = ensureStacks(config.stacks);
  const selectionSeed = Math.floor(Math.random() * 0x7fffffff);
  const selection = buildSelection(roleId, stacks, selectionSeed, questionBank);
  return {
    items: getQuestionsByIds(selection.selectedIds),
    roleId,
    stacks
  };
}

function resolvePracticalItems(config: Record<string, unknown>): { items: ExamQuestion[]; stacks: StackId[] } {
  const stack = String(config.stack || "UiPath") as StackId;
  const pack = pickPracticalPack("Associate", [stack]);
  const question: PracticalTaskQuestion = {
    id: `${pack.id}_practical`,
    format: "practical_task",
    title: pack.title,
    prompt: pack.prompt,
    points: pack.subtasks.reduce((sum, task) => sum + Number(task.points || 0), 0),
    subtasks: pack.subtasks
  };
  return {
    items: [question],
    stacks: [stack]
  };
}

function resolveLogicItems(config: Record<string, unknown>): { items: ExamQuestion[]; stacks: StackId[] } {
  const stack = String(config.stack || "UiPath") as StackId;
  const pack = pickLogicReasoningPack("Associate", [stack]);
  const question: LogicReasoningQuestion = {
    id: `${pack.id}_logic_reasoning`,
    format: "logic_reasoning",
    title: pack.title,
    prompt: pack.prompt,
    points: pack.subtasks.reduce((sum, task) => sum + Number(task.points || 0), 0),
    subtasks: pack.subtasks
  };
  return {
    items: [question],
    stacks: [stack]
  };
}

function resolveGeneralCapabilityItems(): { items: ExamQuestion[]; stacks: StackId[] } {
  return {
    items: generalCapabilityQuestions,
    stacks: ["UiPath"]
  };
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
    let items: ExamQuestion[] = [];

    if (draft.definitionId === "core_exam") {
      items = resolveCoreItems(draft.config ?? {}).items;
    } else if (draft.definitionId === "practical_exam") {
      items = resolvePracticalItems(draft.config ?? {}).items;
    } else if (draft.definitionId === "applied_logic_exam") {
      items = resolveLogicItems(draft.config ?? {}).items;
    } else {
      items = resolveGeneralCapabilityItems().items;
    }

    return {
      instanceId: cuidLike(),
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
  const core = blueprint.exams.find((exam) => exam.definitionId === "core_exam");
  return resolveCoreBasisRoleId(core?.config ?? {}, fallback);
}

export function blueprintStacks(blueprint: ExamBlueprint, fallback: StackId[] = ["UiPath"]): StackId[] {
  const core = blueprint.exams.find((exam) => exam.definitionId === "core_exam");
  if (core) return ensureStacks(core.config?.stacks, fallback);
  const practical = blueprint.exams.find((exam) => exam.definitionId === "practical_exam");
  if (practical) return [String(practical.config?.stack || fallback[0]) as StackId];
  return fallback;
}

export function blueprintLegacySections(blueprint: ExamBlueprint): SectionId[] {
  return blueprint.exams
    .map((exam) => exam.legacySectionId)
    .filter((sectionId): sectionId is SectionId => Boolean(sectionId));
}
