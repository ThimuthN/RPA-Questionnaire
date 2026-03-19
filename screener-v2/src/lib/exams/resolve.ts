import crypto from "node:crypto";
import type {
  ExamBlueprint,
  ExamBlueprintDraftItem,
  ExamDefinitionId,
  ExamQuestion,
  FrozenExamInstance,
  LogicReasoningQuestion,
  PracticalTaskQuestion,
  Question,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import { buildSelection } from "@/lib/assessment-engine/selection";
import { getQuestionsByIds, questionBank } from "@/lib/data/question-bank";
import {
  defaultDraftForDefinition,
  definitionIdFromLegacySection,
  deriveExamSelectionMetadata
} from "@/lib/exams/catalog";
import type { SectionId } from "@/lib/sections/types";
import { buildLogicReasoningQuestion } from "@/features/logic-reasoning/grading";
import { pickLogicReasoningPack } from "@/features/logic-reasoning/packs";
import { buildPracticalQuestion } from "@/features/practical/grading";
import { pickPracticalPack } from "@/features/practical/packs";

function cuidLike() {
  return crypto.randomUUID().replace(/-/g, "");
}

function ensureStacks(value: unknown, fallback: StackId[] = ["UiPath"]): StackId[] {
  if (!Array.isArray(value)) return fallback;
  const stacks = value.map((item) => String(item) as StackId).filter(Boolean);
  return stacks.length > 0 ? stacks : fallback;
}

function ensureRoleId(value: unknown, fallback: RoleId = "Associate"): RoleId {
  return String(value || fallback) as RoleId;
}

function resolveCoreItems(config: Record<string, unknown>): { items: ExamQuestion[]; roleId: RoleId; stacks: StackId[] } {
  const roleId = ensureRoleId(config.roleId);
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
      config: exam.config ?? {},
      weight: exam.weight,
      requiredPercent: exam.requiredPercent
    }));
  }

  if (Array.isArray(args.sections) && args.sections.length > 0) {
    return args.sections.map((sectionId) => {
      const definitionId = definitionIdFromLegacySection(sectionId);
      const draft = defaultDraftForDefinition(definitionId);
      if (definitionId === "core_exam") {
        draft.config = {
          roleId: args.roleId ?? "Associate",
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
    } else {
      items = resolveLogicItems(draft.config ?? {}).items;
    }

    return {
      instanceId: cuidLike(),
      definitionId: draft.definitionId,
      legacySectionId: metadata.legacySectionId,
      label: metadata.label,
      order: index,
      config: draft.config ?? {},
      configSummary: metadata.configSummary,
      durationMinutes: metadata.durationMinutes,
      weight: typeof draft.weight === "number" ? draft.weight : 1,
      requiredPercent:
        typeof draft.requiredPercent === "number" ? draft.requiredPercent : metadata.requiredPercent,
      contentSnapshot: {
        title: metadata.label,
        description: metadata.configSummary,
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
  return ensureRoleId(core?.config?.roleId, fallback);
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
