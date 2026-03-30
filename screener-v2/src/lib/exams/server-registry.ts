import type {
  ExamQuestion,
  LogicReasoningQuestion,
  PracticalTaskQuestion,
  StackId
} from "@/lib/assessment-engine/types";
import type { ExamDefinitionId } from "@/lib/exams/definitions";
import { buildSelection } from "@/lib/assessment-engine/selection";
import { getQuestionsByIds, questionBank } from "@/lib/data/question-bank";
import { businessAnalysisQuestions } from "@/features/business-analysis/questions";
import { buildCore2Questions } from "@/features/core2/questions";
import { generalCapabilityQuestions } from "@/features/general-capability/questions";
import { pickLogicReasoningPack } from "@/features/logic-reasoning/packs";
import { pickPracticalPack } from "@/features/practical/packs";
import { revenueCycleManagementQuestions } from "@/features/rcm/questions";
import { resolveCoreBasisRoleId } from "@/lib/exams/catalog";

function ensureStacks(value: unknown, fallback: StackId[] = ["UiPath"]): StackId[] {
  if (!Array.isArray(value)) return fallback;
  const stacks = value.map((item) => String(item) as StackId).filter(Boolean);
  return stacks.length > 0 ? stacks : fallback;
}

function resolveCoreItems(config: Record<string, unknown>): ExamQuestion[] {
  const roleId = resolveCoreBasisRoleId(config);
  const stacks = ensureStacks(config.stacks);
  const selectionSeed = Math.floor(Math.random() * 0x7fffffff);
  const selection = buildSelection(roleId, stacks, selectionSeed, questionBank);
  return getQuestionsByIds(selection.selectedIds);
}

function resolvePracticalItems(config: Record<string, unknown>): ExamQuestion[] {
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
  return [question];
}

function resolveCore2Items(config: Record<string, unknown>): ExamQuestion[] {
  const stacks = ensureStacks(config.stacks);
  return buildCore2Questions(stacks);
}

function resolveLogicItems(config: Record<string, unknown>): ExamQuestion[] {
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
  return [question];
}

const examContentResolvers: Record<ExamDefinitionId, (config: Record<string, unknown>) => ExamQuestion[]> = {
  core_exam: resolveCoreItems,
  core_2_exam: resolveCore2Items,
  practical_exam: resolvePracticalItems,
  applied_logic_exam: resolveLogicItems,
  general_capability_exam: () => generalCapabilityQuestions,
  business_analysis_exam: () => businessAnalysisQuestions,
  rcm_exam: () => revenueCycleManagementQuestions
};

export function resolveExamItems(definitionId: ExamDefinitionId, config: Record<string, unknown>) {
  return examContentResolvers[definitionId](config);
}
