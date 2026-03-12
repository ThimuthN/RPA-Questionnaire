import type { QuestionFormatId } from "@/lib/assessment-engine/types";
import { bestNextStepDef } from "@/lib/question-types/best-next-step";
import { caseTriageDef } from "@/lib/question-types/case-triage";
import { fillBlankDef } from "@/lib/question-types/fill-blank";
import { logAnalysisDef } from "@/lib/question-types/log-analysis";
import { matchingDef } from "@/lib/question-types/matching";
import { multiSelectDef } from "@/lib/question-types/multi-select";
import { orderingDef } from "@/lib/question-types/ordering";
import { practicalTaskDef } from "@/lib/question-types/practical-task";
import { singleSelectDef } from "@/lib/question-types/single-select";
import { traceExecutionDef } from "@/lib/question-types/trace-execution";
import type { QuestionTypeDef } from "@/lib/question-types/types";

export const questionRegistry: Record<QuestionFormatId, QuestionTypeDef<any, any, any>> = {
  single_select: singleSelectDef,
  multi_select: multiSelectDef,
  ordering: orderingDef,
  matching: matchingDef,
  fill_blank_constrained: fillBlankDef,
  log_analysis_single_select: logAnalysisDef,
  trace_execution: traceExecutionDef,
  best_next_step: bestNextStepDef,
  case_triage: caseTriageDef,
  practical_task: practicalTaskDef
};

export const formatAliasMap: Record<string, QuestionFormatId> = {
  single_choice: "single_select",
  log_analysis_single_choice: "log_analysis_single_select",
  match_pairs: "matching",
  fill_in_blank_constrained: "fill_blank_constrained"
};
